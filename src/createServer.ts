import { randomUUID } from "node:crypto";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import { fastifyJwt } from "@fastify/jwt";
import fastifyRedis from "@fastify/redis";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import envSchema from "env-schema";
import Fastify from "fastify";
import {
	type EnvConfig,
	envConfigSchema,
	envSchemaAjv,
} from "./envConfigSchema";
import plugins from "./fastifyPlugins/index";
import routes from "./routes/index";
import { fastifyOtelInstrumentation } from "./tracing";
import { loggerOptions } from "./utilities/logging/logger";

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
	// The `data` option has highest precedence, allowing tests to override required env vars.
	const envConfig = envSchema<EnvConfig>({
		ajv: envSchemaAjv,
		data: options?.envConfig,
		dotenv: true,
		schema: envConfigSchema,
	});

	/**
	 * The root fastify instance or we could say the talawa api server itself. It could be considered as the root node of a directed acyclic graph(DAG) of fastify plugins.
	 */
	const fastify = Fastify({
		// Maximum size in bytes of the body of any request that the server will accept. More information here: https://fastify.dev/docs/latest/Reference/Server/#bodylimit.This limit is defined on a global server context therefore it will be applied to all requests to the server. This is not practical for all use cases and should instead be applied on a per-route/per-module basis. For example, 50 megabytes might not be sufficient for many static file transfers, similarly, 50 megabytes is too big for simple JSON requests.
		bodyLimit: 52428800,
		pluginTimeout: 30000,
		// For configuring the pino.js logger that comes integrated with fastify. More information at this link: https://fastify.dev/docs/latest/Reference/Logging/
		logger: loggerOptions,
		genReqId: (req) => {
			const headerValue = req.headers["x-correlation-id"];
			if (
				typeof headerValue === "string" &&
				/^[a-f0-9-]{36}$/i.test(headerValue)
			) {
				return headerValue;
			}
			return randomUUID();
		},
	}).withTypeProvider<TypeBoxTypeProvider>();

	fastify.addHook("onRequest", async (request, reply) => {
		const correlationId = request.id as string;
		reply.header("x-correlation-id", correlationId);
		request.log = request.log.child({ correlationId });
	});

	await fastify.register(fastifyOtelInstrumentation.plugin());

	// THE FASTIFY PLUGIN LOAD ORDER MATTERS, PLUGINS MIGHT BE DEPENDENT ON OTHER PLUGINS ALREADY BEING REGISTERED. THEREFORE THE ORDER OF REGISTRATION MUST BE MAINTAINED UNLESS THE DEVELOPER KNOWS WHAT THEY'RE DOING.

	fastify.decorate("envConfig", envConfig);
	// More information at this link: https://github.com/fastify/fastify-rate-limit

	// More information at this link: https://github.com/fastify/fastify-cors
	fastify.register(fastifyCors, {
		origin: fastify.envConfig.API_FRONTEND_URL,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"Apollo-Require-Preflight",
		],
		credentials: true,
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

	// fastify.register(fastifyRedis, {
	// 	url: fastify.envConfig.API_REDIS_URI,
	// 	closeClient: true,
	// });

	// More information at this link: https://github.com/fastify/fastify-cookie
	// Used for HTTP-Only cookie authentication to protect session tokens from XSS attacks
	fastify.register(fastifyCookie, {
		secret: fastify.envConfig.API_COOKIE_SECRET,
		parseOptions: {},
	});

	// More information at this link: https://github.com/fastify/fastify-jwt
	fastify.register(fastifyJwt, {
		secret: fastify.envConfig.API_JWT_SECRET,
		sign: {
			expiresIn: fastify.envConfig.API_JWT_EXPIRES_IN,
		},
	});

	fastify.register(plugins, {});

	fastify.register(routes, {});

	return fastify;
};
