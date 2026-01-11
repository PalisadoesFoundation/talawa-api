import { complexityFromQuery } from "@pothos/plugin-complexity";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { mercurius } from "mercurius";
import { mercuriusUpload } from "mercurius-upload";
import type {
	CurrentClient,
	ExplicitAuthenticationTokenPayload,
	ExplicitGraphQLContext,
} from "~/src/graphql/context";
import schemaManager from "~/src/graphql/schemaManager";
import NotificationService from "~/src/services/notification/NotificationService";
import {
	COOKIE_NAMES,
	getAccessTokenCookieOptions,
	getClearAccessTokenCookieOptions,
	getClearRefreshTokenCookieOptions,
	getRefreshTokenCookieOptions,
} from "../utilities/cookieConfig";
import { createDataloaders } from "../utilities/dataloaders";
import leakyBucket from "../utilities/leakyBucket";
import { type AppLogger, withFields } from "../utilities/logging/logger";
import { DEFAULT_REFRESH_TOKEN_EXPIRES_MS } from "../utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "../utilities/TalawaGraphQLError";

/**
 * Type of the initial context argument provided to the createContext function by the graphql server.
 */
type InitialContext = {
	fastify: FastifyInstance;
	request: FastifyRequest;
} & (
	| {
			/**
			 * This field is `false` if the current graphql operation isn't a subscription.
			 */
			isSubscription: false;
			/**
			 * This field is only present if the current graphql operation isn't a subscription.
			 */
			reply: FastifyReply;
			socket?: never;
	  }
	| {
			/**
			 * This field is `true` if the current graphql operation is a subscription.
			 */
			isSubscription: true;
			reply?: never;
			/**
			 * This field is only present if the current graphql operation is a subscription.
			 */
			socket: WebSocket;
	  }
);

export type CreateContext = (
	initialContext: InitialContext,
) => Promise<ExplicitGraphQLContext>;

/**
 * This function is used to create the explicit context passed to the graphql resolvers each time they resolve a graphql operation at runtime. All the transport protocol specific information should be dealt with within this function and the return type of this function must be transport protocol agnostic.
 */
export const createContext: CreateContext = async (initialContext) => {
	const { fastify, request } = initialContext;

	// Try to authenticate from Authorization header first, then fall back to cookie
	let currentClient: CurrentClient;

	try {
		// First try Authorization header (existing behavior for mobile clients)
		const jwtPayload =
			await request.jwtVerify<ExplicitAuthenticationTokenPayload>();
		currentClient = {
			isAuthenticated: true,
			user: jwtPayload.user,
		};
	} catch (_headerError) {
		// If no Authorization header, try to get token from cookie (web clients)
		const accessTokenFromCookie = request.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];
		if (accessTokenFromCookie) {
			try {
				const jwtPayload =
					await fastify.jwt.verify<ExplicitAuthenticationTokenPayload>(
						accessTokenFromCookie,
					);
				currentClient = {
					isAuthenticated: true,
					user: jwtPayload.user,
				};
			} catch (_cookieError) {
				currentClient = {
					isAuthenticated: false,
				};
			}
		} else {
			currentClient = {
				isAuthenticated: false,
			};
		}
	}

	// Cookie configuration options (sameSite is set per-cookie in helpers)
	const cookieConfig = {
		isSecure:
			fastify.envConfig.API_IS_SECURE_COOKIES ??
			process.env.NODE_ENV === "production",
		domain: fastify.envConfig.API_COOKIE_DOMAIN,
		path: "/",
	};

	// Create cookie helper only for HTTP requests (not WebSocket subscriptions)
	const cookieHelper =
		!initialContext.isSubscription && initialContext.reply
			? {
					setAuthCookies: (accessToken: string, refreshToken: string) => {
						const jwtExpiresIn = fastify.envConfig.API_JWT_EXPIRES_IN;
						const refreshExpiresIn =
							fastify.envConfig.API_REFRESH_TOKEN_EXPIRES_IN ??
							DEFAULT_REFRESH_TOKEN_EXPIRES_MS;

						initialContext.reply.setCookie(
							COOKIE_NAMES.ACCESS_TOKEN,
							accessToken,
							getAccessTokenCookieOptions(cookieConfig, jwtExpiresIn),
						);
						initialContext.reply.setCookie(
							COOKIE_NAMES.REFRESH_TOKEN,
							refreshToken,
							getRefreshTokenCookieOptions(cookieConfig, refreshExpiresIn),
						);
					},
					clearAuthCookies: () => {
						initialContext.reply.setCookie(
							COOKIE_NAMES.ACCESS_TOKEN,
							"",
							getClearAccessTokenCookieOptions(cookieConfig),
						);
						initialContext.reply.setCookie(
							COOKIE_NAMES.REFRESH_TOKEN,
							"",
							getClearRefreshTokenCookieOptions(cookieConfig),
						);
					},
					getRefreshToken: () => {
						return request.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
					},
				}
			: undefined;

	// Attach operation name to logger if available
	const body = request.body as Record<string, unknown> | undefined;
	const operationName = (body?.operationName as string) ?? "unknown";

	const opLogger = withFields(request.log as AppLogger, {
		operation: operationName,
	});

	return {
		cache: fastify.cache,
		currentClient,
		dataloaders: createDataloaders(fastify.drizzleClient, fastify.cache),
		drizzleClient: fastify.drizzleClient,
		envConfig: fastify.envConfig,
		jwt: {
			sign: (payload: ExplicitAuthenticationTokenPayload) =>
				fastify.jwt.sign(payload),
		},
		cookie: cookieHelper,
		log: opLogger,
		minio: fastify.minio,

		// attached a per-request notification service that queues notifications and can flush later
		notification: new NotificationService(),
	};
};

/**
 * File upload configuration for GraphQL multipart requests.
 * These limits are enforced by mercurius-upload and are exported for use in tests.
 */
export const FILE_UPLOAD_CONFIG = {
	/**
	 * Maximum allowed non-file multipart form field size in bytes.
	 * This is the size of the actual graphql document excluding file uploads.
	 * 1024 * 1024 = 1MB
	 */
	maxFieldSize: 1048576,
	/**
	 * Maximum allowed number of files in a single graphql operation.
	 */
	maxFiles: 20,
	/**
	 * Maximum allowed file size in bytes.
	 * 1024 * 1024 * 10 = 10MB
	 */
	maxFileSize: 10485760,
} as const;

/**
 * This fastify route plugin function is initializes mercurius on the fastify instance and directs incoming requests on the `/graphql` route to it.
 */
export const graphql = fastifyPlugin(async (fastify) => {
	/**
	 * More information at these links:
	 * 1. {@link https://github.com/mercurius-js/mercurius-upload}
	 * 2. {@link https://github.com/flash-oss/graphql-upload-minimal/blob/56e83775b114edc169f605041d983156d4131387/public/index.js#L61}
	 */
	await fastify.register(mercuriusUpload, FILE_UPLOAD_CONFIG);

	// Build initial schema with active plugins
	const initialSchema = await schemaManager.buildInitialSchema();

	// More information at this link: https://mercurius.dev/#/docs/api/options?id=mercurius
	await fastify.register(mercurius, {
		context: (request, reply) =>
			createContext({
				fastify,
				isSubscription: false,
				request,
				reply,
			}),
		graphiql: {
			enabled: fastify.envConfig.API_IS_GRAPHIQL,
		},
		cache: false,
		path: "/graphql",
		schema: initialSchema,
		errorFormatter: (execution, context) => {
			const correlationId = context.reply.request.id;

			return {
				statusCode: 200,
				response: {
					data: execution.data ?? null,
					errors: execution.errors.map((err) => ({
						message: err.message,
						locations: err.locations,
						path: err.path,
						extensions: {
							...err.extensions,
							correlationId,
						},
					})),
				},
			};
		},
		subscription: {
			onConnect: async (data) => {
				const { payload } = data;
				if (!payload?.authorization) {
					return false;
				}
				try {
					const token = payload.authorization.replace("Bearer ", "");
					const decoded =
						await fastify.jwt.verify<ExplicitAuthenticationTokenPayload>(token);

					fastify.log.info(
						{ user: decoded.user },
						"Subscription connection authorized.",
					);

					return {
						cache: fastify.cache,
						currentClient: {
							isAuthenticated: true,
							user: decoded.user,
						},
						dataloaders: createDataloaders(
							fastify.drizzleClient,
							fastify.cache,
						),
						drizzleClient: fastify.drizzleClient,
						envConfig: fastify.envConfig,
						jwt: {
							sign: (payload: ExplicitAuthenticationTokenPayload) =>
								fastify.jwt.sign(payload),
						},
						log: fastify.log,
						minio: fastify.minio,
						notification: new NotificationService(),
					};
				} catch (error) {
					fastify.log.error(
						{ error },
						"Subscription connection rejected: Invalid token.",
					);
					return false;
				}
			},

			// Context is provided by onConnect for authenticated connections

			// KeepAlive is fine as it is
			keepAlive: 1000 * 30,
			// A function which is called with the subscription context of the connection after the connection gets disconnected.
			onDisconnect: (_ctx) => {
				// no cleanup needed on disconnect (intentional no-op)
			},
			// This function is used to validate incoming Websocket connections.
			verifyClient: (_info, next) => {
				next(true);
			},
		},
	});

	// Register schema update callback to replace schema when plugins are activated/deactivated
	schemaManager.onSchemaUpdate((newSchema) => {
		try {
			// Replace the schema in the Mercurius instance
			fastify.graphql.replaceSchema(newSchema);
			fastify.log.info(
				{
					timestamp: new Date().toISOString(),
					newSchemaFields: {
						queries: Object.keys(newSchema.getQueryType()?.getFields() || {}),
						mutations: Object.keys(
							newSchema.getMutationType()?.getFields() || {},
						),
						subscriptions: Object.keys(
							newSchema.getSubscriptionType()?.getFields() || {},
						),
					},
				},
				"✅ GraphQL Schema Updated Successfully",
			);
		} catch (error) {
			fastify.log.error(
				{
					error:
						error instanceof Error
							? {
									message: error.message,
									stack: error.stack,
									name: error.name,
								}
							: String(error),
					timestamp: new Date().toISOString(),
				},
				"❌ Failed to Update GraphQL Schema",
			);
		}
	});
	fastify.graphql.addHook(
		"preExecution",
		async (schema, context, document, variables) => {
			// Calculate the complexity of the incoming GraphQL query
			const complexity = complexityFromQuery(document.__currentQuery, {
				schema: schema,
				variables: variables,
			});
			const request = document.reply.request;

			// Find the operation definition node to determine if this is a query, mutation, or subscription
			const operationDefinition = context.definitions.find(
				(definition) => definition.kind === "OperationDefinition",
			);
			const operationType = operationDefinition
				? operationDefinition.operation
				: undefined;

			// Mutations typically have a higher base cost than queries
			// Add the configured base cost for mutations to increase their complexity score
			if (operationType === "mutation") {
				complexity.complexity +=
					fastify.envConfig.API_GRAPHQL_MUTATION_BASE_COST;
			}

			// Get the IP address of the client making the request
			const ip = request.ip;

			// Verify the JWT token to get the user information
			// This is used to identify the user for rate limiting purposes
			let currentClient: CurrentClient;
			try {
				const jwtPayload =
					await request.jwtVerify<ExplicitAuthenticationTokenPayload>();
				currentClient = {
					isAuthenticated: true,
					user: jwtPayload.user,
				};
			} catch (_error) {
				currentClient = {
					isAuthenticated: false,
				};
			}

			if (!ip) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "IP address is not available for rate limiting",
				});
			}

			// Generate a rate limiting key based on user ID (if available) or IP address
			// This allows different rate limits for authenticated vs unauthenticated users
			let key: string;
			if (currentClient.isAuthenticated) {
				// For authenticated users, use both user ID and IP to prevent sharing accounts
				key = `rate-limit:user:${currentClient.user.id}:${ip}`;
			} else {
				// For unauthenticated users, use only IP address
				key = `rate-limit:ip:${ip}`;
			}
			const isRequestAllowed = await leakyBucket(
				fastify,
				key,
				fastify.envConfig.API_RATE_LIMIT_BUCKET_CAPACITY,
				fastify.envConfig.API_RATE_LIMIT_REFILL_RATE,
				complexity.complexity,
				request.log as AppLogger,
			);

			// If the request exceeds rate limits, reject it
			if (!isRequestAllowed) {
				throw new TalawaGraphQLError({
					extensions: { code: "too_many_requests" },
				});
			}
		},
	);
});

export default graphql;
