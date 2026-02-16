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

export type { EnvConfig } from "./envConfigSchema";

// Currently fastify provides typescript integration through the usage of ambient typescript declarations where the type of global fastify instance is extended with our custom types. This approach is not sustainable for implementing scoped and encapsulated business logic which is meant to be the main advantage of fastify plugins. The fastify team is aware of this problem and is currently looking for a more elegant approach for typescript integration. More information can be found at this link: https://github.com/fastify/fastify/issues/5061
declare module "fastify" {
	interface FastifyInstance {
		/**
		 * Parsed configuration environment variables used by talawa api.
		 */
		envConfig: EnvConfig;
	}
}

const PLACEHOLDER_SENTINEL = "CHANGE_ME_BEFORE_DEPLOY";

/**
 * Error thrown during process startup when critical configuration is missing or
 * still set to the placeholder sentinel (`PLACEHOLDER_SENTINEL`).
 */
export class StartupConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "StartupConfigError";
	}
}

/**
 * Validates that critical secrets in the environment configuration are neither
 * empty nor set to the placeholder sentinel (`PLACEHOLDER_SENTINEL`).
 *
 * This check is primarily intended to prevent accidental deployments using the
 * default sentinel placeholders in production templates.
 *
 * @param envConfig - The parsed environment configuration. This function checks
 * API-level secrets such as `API_JWT_SECRET`, `API_COOKIE_SECRET`,
 * `API_MINIO_SECRET_KEY`, `API_POSTGRES_PASSWORD`, and
 * `API_ADMINISTRATOR_USER_PASSWORD`.
 * Additionally, when present, it validates `process.env.MINIO_ROOT_PASSWORD` and
 * `process.env.POSTGRES_PASSWORD` (service-level credentials injected for the
 * rootless-production compose path).
 * @returns void - Returns nothing; throws {@link StartupConfigError} when any
 * required secret is empty or contains the placeholder sentinel.
 * @throws {StartupConfigError} If any required secret is empty or contains the
 * placeholder sentinel.
 */
export const assertSecretsPresent = (envConfig: EnvConfig) => {
	const invalidEnvNames: string[] = [];

	const isEmptyOrPlaceholder = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length === 0 || trimmed.includes(PLACEHOLDER_SENTINEL);
	};

	const checkRequired = (name: string, value: string) => {
		if (isEmptyOrPlaceholder(value)) {
			invalidEnvNames.push(name);
		}
	};

	checkRequired("API_JWT_SECRET", envConfig.API_JWT_SECRET);
	checkRequired("API_COOKIE_SECRET", envConfig.API_COOKIE_SECRET);
	checkRequired("API_MINIO_SECRET_KEY", envConfig.API_MINIO_SECRET_KEY);
	checkRequired("API_POSTGRES_PASSWORD", envConfig.API_POSTGRES_PASSWORD);
	checkRequired(
		"API_ADMINISTRATOR_USER_PASSWORD",
		envConfig.API_ADMINISTRATOR_USER_PASSWORD,
	);

	// Only validate these when explicitly present for the API process.
	// These are intentionally read from process.env (not envConfig) because they are
	// service-level vars outside the API env-schema, and are only injected for the
	// rootless-production startup check via docker/compose.rootless.production.yaml.
	const minioRootPassword = process.env.MINIO_ROOT_PASSWORD;
	if (minioRootPassword !== undefined) {
		checkRequired("MINIO_ROOT_PASSWORD", minioRootPassword);
	}

	const postgresPassword = process.env.POSTGRES_PASSWORD;
	if (postgresPassword !== undefined) {
		checkRequired("POSTGRES_PASSWORD", postgresPassword);
	}

	if (invalidEnvNames.length > 0) {
		throw new StartupConfigError(
			`Refusing to start: replace placeholder/empty values for: ${invalidEnvNames.join(
				", ",
			)}`,
		);
	}
};

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

	assertSecretsPresent(envConfig);

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
