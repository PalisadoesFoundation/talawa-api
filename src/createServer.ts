import type { IncomingHttpHeaders } from "node:http";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import { fastifyJwt } from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyRedis from "@fastify/redis";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import envSchema from "env-schema";
import Fastify from "fastify";
import {
	type EnvConfig,
	envConfigSchema,
	envSchemaAjv,
} from "./envConfigSchema";
import { auth } from "./lib/auth";
import plugins from "./plugins/index";
import routes from "./routes/index";

// Currently fastify provides typescript integration through the usage of ambient typescript declarations where the type of global fastify instance is extended with our custom types. This approach is not sustainable for implementing scoped and encapsulated business logic which is meant to be the main advantage of fastify plugins. The fastify team is aware of this problem and is currently looking for a more elegant approach for typescript integration. More information can be found at this link: https://github.com/fastify/fastify/issues/5061
declare module "fastify" {
	interface FastifyInstance {
		/**
		 * Parsed configuration environment variables used by talawa api.
		 */
		envConfig: EnvConfig;
	}
}

/**
 * This function is used to set up the fastify server.
 */
export const createServer = async (options?: {
	/**
	 * Optional custom configuration environment variables that would merge or override the default configuration environment variables used by talawa api.
	 */
	envConfig?: Partial<EnvConfig>;
}) => {
	// Configuration environment variables used by talawa api.
	const envConfig = envSchema<EnvConfig>({
		ajv: envSchemaAjv,
		dotenv: true,
		schema: envConfigSchema,
	});

	// Merge or override default configuration environment variables with custom configuration environment variables passed by this function's caller.
	Object.assign(envConfig, options?.envConfig);

	/**
	 * The root fastify instance or we could say the talawa api server itself. It could be considered as the root node of a directed acyclic graph(DAG) of fastify plugins.
	 */
	const fastify = Fastify({
		// Maximum size in bytes of the body of any request that the server will accept. More information here: https://fastify.dev/docs/latest/Reference/Server/#bodylimit.This limit is defined on a global server context therefore it will be applied to all requests to the server. This is not practical for all use cases and should instead be applied on a per-route/per-module basis. For example, 50 megabytes might not be sufficient for many static file transfers, similarly, 50 megabytes is too big for simple JSON requests.
		bodyLimit: 52428800,

		// For configuring the pino.js logger that comes integrated with fastify. More information at this link: https://fastify.dev/docs/latest/Reference/Logging/
		logger: {
			level: envConfig.API_LOG_LEVEL,
			transport: envConfig.API_IS_PINO_PRETTY
				? {
						target: "pino-pretty",
					}
				: undefined,
		},
	}).withTypeProvider<TypeBoxTypeProvider>();

	// THE FASTIFY PLUGIN LOAD ORDER MATTERS, PLUGINS MIGHT BE DEPENDENT ON OTHER PLUGINS ALREADY BEING REGISTERED. THEREFORE THE ORDER OF REGISTRATION MUST BE MAINTAINED UNLESS THE DEVELOPER KNOWS WHAT THEY'RE DOING.

	fastify.decorate("envConfig", envConfig);
	// More information at this link: https://github.com/fastify/fastify-rate-limit
	fastify.register(fastifyRateLimit, {});

	// More information at this link: https://github.com/fastify/fastify-cors
	fastify.register(fastifyCors, {
		origin: "http://localhost:4321", // Allow only your frontend origin
		credentials: true, // Allow sending cookies and authentication headers
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"apollo-require-preflight",
		], // Allowed headers
	});

	// More information at this link: https://github.com/fastify/fastify-helmet
	fastify.register(fastifyHelmet, {
		// This field needs to be `false` for mercurius graphiql web client to work.
		contentSecurityPolicy: !fastify.envConfig.API_IS_GRAPHIQL,
	});

	fastify.register(fastifyRedis, {
		host: fastify.envConfig.API_REDIS_HOST,
		port: fastify.envConfig.API_REDIS_PORT,
		closeClient: true,
	});

	// More information at this link: https://github.com/fastify/fastify-jwt
	fastify.register(fastifyJwt, {
		secret: fastify.envConfig.API_JWT_SECRET,
		sign: {
			expiresIn: fastify.envConfig.API_JWT_EXPIRES_IN,
		},
	});
	fastify.all("/api/auth/*", async (req, reply) => {
		// Convert FastifyRequest to Fetch API Request
		console.log(`✅ Route hit: ${req.method} ${req.url}`);
		const headers: Record<string, string> = {};
		for (const [key, value] of Object.entries(
			req.headers as IncomingHttpHeaders,
		)) {
			if (value) {
				headers[key] = Array.isArray(value) ? value.join(", ") : value;
			}
		}

		const fetchRequest = new Request(
			`${req.protocol}://${req.hostname}${req.url}`,
			{
				method: req.method,
				headers,
				body:
					req.method !== "GET" && req.method !== "HEAD"
						? JSON.stringify(req.body)
						: undefined,
			},
		);
		// Handle authentication
		const response = await auth.handler(fetchRequest);

		// Send response back to Fastify
		reply.status(response.status);
		response.headers.forEach((value, key) => reply.header(key, value));
		reply.send(await response.text());
	});

	fastify.register(plugins, {});

	fastify.register(routes, {});

	return fastify;
};
