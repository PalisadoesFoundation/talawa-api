import { type Span, trace } from "@opentelemetry/api";
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
import { observabilityConfig } from "../config/observability";
import { metricsCacheProxy } from "../services/metrics/metricsCacheProxy";
import {
	COOKIE_NAMES,
	getAccessTokenCookieOptions,
	getClearAccessTokenCookieOptions,
	getClearRefreshTokenCookieOptions,
	getRefreshTokenCookieOptions,
} from "../utilities/cookieConfig";
import { createDataloaders } from "../utilities/dataloaders";
import {
	ERROR_CODE_TO_HTTP_STATUS,
	ErrorCode,
} from "../utilities/errors/errorCodes";
import { normalizeError } from "../utilities/errors/errorTransformer";
import leakyBucket from "../utilities/leakyBucket";
import { type AppLogger, withFields } from "../utilities/logging/logger";
import {
	isPerformanceTracker,
	type PerformanceTracker,
} from "../utilities/metrics/performanceTracker";
import { DEFAULT_REFRESH_TOKEN_EXPIRES_MS } from "../utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "../utilities/TalawaGraphQLError";

const SPECIFIC_ERROR_ALLOWLIST = [
	"Minio removal error",
	"An error occurred while fetching users",
	"An error occurred while fetching events",
	"Invalid UUID",
	"database_error",
] as const;

function getPublicErrorMessage(
	error: { message?: string },
	defaultMessage: string,
): string {
	const msg = error.message;
	if (!msg) return defaultMessage;

	// Allow SPECIFIC_ERROR_ALLOWLIST messages (exact match only)
	if (
		SPECIFIC_ERROR_ALLOWLIST.includes(
			msg as (typeof SPECIFIC_ERROR_ALLOWLIST)[number],
		)
	) {
		return msg;
	}

	// Also check for messages that end with a period (resolver error messages)
	const msgWithoutPeriod = msg.endsWith(".") ? msg.slice(0, -1) : msg;
	if (
		SPECIFIC_ERROR_ALLOWLIST.includes(
			msgWithoutPeriod as (typeof SPECIFIC_ERROR_ALLOWLIST)[number],
		)
	) {
		return msgWithoutPeriod;
	}

	// Mask sensitive/unsafe messages
	if (
		msg.startsWith("Database") ||
		msg.includes("query:") ||
		msg.includes("boom")
	) {
		return defaultMessage;
	}

	// Fallback for unknown messages those are not safe to expose
	return defaultMessage;
}

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

/**
 * Type for the data passed to the subscription onConnect callback.
 * Contains the authorization payload and optional socket with performance tracker.
 */
type SubscriptionConnectionData = {
	payload?: { authorization?: string };
	socket?: {
		request?: {
			perf?: PerformanceTracker;
		};
	};
};

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
		cache: request.perf
			? metricsCacheProxy(fastify.cache, request.perf)
			: fastify.cache,
		currentClient,
		dataloaders: createDataloaders(
			fastify.drizzleClient,
			fastify.cache,
			request.perf,
		),
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
		perf: request.perf,
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
 * Helper to extract meaningful messages from Zod error details.
 * Encapsulates logic for parsing JSON/treeified details and handling specific validation messages like UUID errors.
 */
function extractZodMessage(
	normalizedDetails: unknown,
	error: unknown,
	fallbackMessage: string,
): string {
	try {
		const details =
			typeof normalizedDetails === "string"
				? JSON.parse(normalizedDetails)
				: normalizedDetails;

		// Handle treeified Zod error format
		if (details && typeof details === "object" && "properties" in details) {
			const properties = details.properties as Record<
				string,
				{ errors: string[] }
			>;
			if (properties.id && Array.isArray(properties.id.errors)) {
				if (properties.id.errors.includes("Invalid UUID")) {
					return "Invalid uuid";
				}
			}
		}
		// Handle array format
		else if (Array.isArray(details) && details.length > 0) {
			const firstError = details[0];
			if (
				firstError &&
				typeof firstError === "object" &&
				"message" in firstError
			) {
				const zodMessage = String(firstError.message);
				if (zodMessage === "Invalid UUID" || zodMessage === "Invalid uuid") {
					return "Invalid uuid";
				}
				return zodMessage;
			}
		}
	} catch {
		// ignore parsing errors
	}

	// Fallback: Check for Zod patterns in original error messages
	const castError = error as {
		message?: string;
		originalError?: { message?: string };
	};
	const errorMessage = castError.message || "";
	const originalErrorMessage = castError.originalError?.message || "";

	if (
		errorMessage.includes("Invalid UUID") ||
		originalErrorMessage.includes("Invalid UUID")
	) {
		return "Invalid uuid";
	}

	return getPublicErrorMessage(castError, fallbackMessage);
}

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
			const { errors, data } = execution;

			// Helper to extract correlation ID safely from various context shapes
			const extractCorrelationId = (ctx: unknown): string => {
				if (!ctx || typeof ctx !== "object") return "unknown";

				// Check for reply.request.id (HTTP context)
				if ("reply" in ctx) {
					const replyCtx = ctx as {
						reply?: { request?: { id?: string } };
					};
					if (replyCtx.reply?.request?.id) return replyCtx.reply.request.id;
				}

				// Check for correlationId (Subscription context or direct property)
				if ("correlationId" in ctx) {
					const correlationCtx = ctx as { correlationId?: string };
					if (correlationCtx.correlationId) return correlationCtx.correlationId;
				}

				return "unknown";
			};

			const correlationId = extractCorrelationId(context);

			// Transform each error to ensure consistent format
			const formattedErrors = errors.map((error) => {
				// If it's already a TalawaGraphQLError (or wraps one), preserve its structure
				const originalError = error.originalError;
				if (
					error instanceof TalawaGraphQLError ||
					originalError instanceof TalawaGraphQLError
				) {
					const targetError =
						error instanceof TalawaGraphQLError
							? error
							: (originalError as TalawaGraphQLError);

					const code = targetError.extensions.code as ErrorCode;
					const httpStatus =
						targetError.extensions.httpStatus ??
						ERROR_CODE_TO_HTTP_STATUS[code] ??
						500;

					return {
						message: String(targetError.message || "An error occurred"),
						locations: error.locations,
						path: error.path,
						extensions: {
							...targetError.extensions,
							httpStatus,
							correlationId,
						},
					};
				}

				// Handle GraphQL syntax and validation errors
				// Check for explicit GraphQL error codes and specific message patterns
				const isGraphQLValidationError =
					error.extensions?.code === "GRAPHQL_VALIDATION_FAILED" ||
					error.extensions?.code === "BAD_USER_INPUT" ||
					error.extensions?.code === "GRAPHQL_PARSE_FAILED" ||
					// Check for Mercurius validation errors
					(error.originalError &&
						typeof error.originalError === "object" &&
						"code" in error.originalError &&
						error.originalError.code === "MER_ERR_GQL_VALIDATION") ||
					// Check for specific error messages
					(error.message &&
						(error.message === "Graphql validation error" ||
							error.message.startsWith("Syntax Error:") ||
							error.message.startsWith("Cannot query field") ||
							error.message.includes("Unknown query") ||
							error.message.includes("Unknown field") ||
							error.message.includes("Must provide query string.") ||
							error.message?.startsWith("Unknown argument") ||
							error.message?.startsWith('Variable "$')));

				if (isGraphQLValidationError) {
					return {
						message: String(error.message || "GraphQL validation error"),
						locations: error.locations,
						path: error.path,
						extensions: {
							code: ErrorCode.INVALID_ARGUMENTS,
							correlationId,
							httpStatus: 400,
						},
					};
				}

				// Fallback for all other errors
				// First check if the error already has a valid ErrorCode in extensions
				if (
					error.extensions?.code &&
					Object.values(ErrorCode).includes(error.extensions.code as ErrorCode)
				) {
					const existingCode = error.extensions.code as ErrorCode;
					const httpStatus = ERROR_CODE_TO_HTTP_STATUS[existingCode] ?? 500;

					// For valid ErrorCode, preserve meaningful messages but use normalizeError for details
					const normalized = normalizeError(error);
					const message: string =
						[error.extensions?.message, error.message, normalized.message].find(
							(msg): msg is string =>
								typeof msg === "string" && msg.trim().length > 0,
						) ?? "An error occurred";

					return {
						message,
						locations: error.locations,
						path: error.path,
						extensions: {
							code: existingCode,
							details: normalized.details,
							correlationId,
							httpStatus,
						},
					};
				}

				// Handle errors without extensions using normalized, sanitized output
				if (!error.extensions) {
					const normalized = normalizeError(error);

					// For validation errors, trying to extract meaningful message from the details
					let message = String(normalized.message || "An error occurred");

					// Check if this is a Zod validation error with details
					if (
						normalized.code === ErrorCode.INVALID_ARGUMENTS &&
						normalized.details
					) {
						message = extractZodMessage(normalized.details, error, message);
					} else {
						// Preserve specific resolver error messages that are safe to expose
						message = getPublicErrorMessage(error, message);
					}

					return {
						message,
						locations: error.locations,
						path: error.path,
						extensions: {
							code: normalized.code || ErrorCode.INTERNAL_SERVER_ERROR,
							details: normalized.details,
							correlationId,
							httpStatus: normalized.statusCode || 500,
						},
					};
				}

				// For errors with extensions but invalid codes, use normalizeError
				const normalized = normalizeError(error);

				// Preserve specific resolver error messages that are safe to expose
				// These are specific error messages that tests and resolvers expect to be preserved
				let message = String(normalized.message || "An error occurred");

				// Check for ZodError patterns in the original error message (for production mode)
				const errorMessage = String(error.message || "");
				if (
					normalized.code === ErrorCode.INTERNAL_SERVER_ERROR &&
					errorMessage.includes("Invalid UUID")
				) {
					message = "Invalid uuid";
				}
				// Special handling for Zod validation errors
				if (
					(normalized.code === ErrorCode.INTERNAL_SERVER_ERROR ||
						normalized.code === ErrorCode.INVALID_ARGUMENTS) &&
					normalized.details
				) {
					message = extractZodMessage(normalized.details, error, message);
				} else {
					message = getPublicErrorMessage(error, message);
				}

				return {
					message,
					locations: error.locations,
					path: error.path,
					extensions: {
						code: normalized.code,
						details: normalized.details,
						correlationId,
						httpStatus: normalized.statusCode,
					},
				};
			});

			// Log errors with structured context
			type Logger = { error: (obj: Record<string, unknown>) => void };
			const contextWithLogger = context as {
				reply?: { request?: { log?: Logger } };
				log?: Logger;
			};
			const logger =
				contextWithLogger.reply?.request?.log || contextWithLogger.log;
			if (logger?.error) {
				logger.error({
					msg: "GraphQL error",
					correlationId,
					errors: formattedErrors.map((fe, index) => ({
						message: fe.message,
						originalMessage: errors[index]?.message,
						code: fe.extensions?.code,
						details: fe.extensions?.details,
						path: fe.path,
					})),
				});
			}

			// Determine appropriate status code based on error types
			let statusCode = 200;
			if (formattedErrors.length > 0) {
				const errorCodes = formattedErrors.map(
					(error) => error.extensions?.code as string,
				);

				// Check for specific error types and set appropriate status codes
				// Priority ordering ensures that we handle the most specific and critical errors first:
				// 1. UNAUTHENTICATED: Missing credentials; highest priority to block access immediately.
				// 2. UNAUTHORIZED: Valid credentials but insufficient permissions; check logic before validation.
				// 3. INVALID_ARGUMENTS: Application-level validation; processed if auth is successful.
				// 4. NOT_FOUND: Resource lookup; logically happens after input validation.
				// 5. RATE_LIMIT_EXCEEDED: Operational safeguard; checked independently but grouped here.
				// Fallback: Defaults to the first error's httpStatus or 500 if no known code is matched.

				const codeIncludesAny = (
					targetCodes: ErrorCode[],
					actualCodes: string[],
				) => targetCodes.some((code) => actualCodes.includes(code));

				if (
					codeIncludesAny(
						[
							ErrorCode.UNAUTHENTICATED,
							ErrorCode.TOKEN_EXPIRED,
							ErrorCode.TOKEN_INVALID,
						],
						errorCodes,
					)
				) {
					statusCode = 401;
				} else if (
					codeIncludesAny(
						[
							ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
							ErrorCode.UNAUTHORIZED,
							ErrorCode.INSUFFICIENT_PERMISSIONS,
							ErrorCode.FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
							ErrorCode.FORBIDDEN_ACTION,
						],
						errorCodes,
					)
				) {
					statusCode = 403;
				} else if (
					codeIncludesAny(
						[ErrorCode.INVALID_ARGUMENTS, ErrorCode.INVALID_INPUT],
						errorCodes,
					)
				) {
					statusCode = 400;
				} else if (
					codeIncludesAny(
						[
							ErrorCode.NOT_FOUND,
							ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
						],
						errorCodes,
					)
				) {
					statusCode = 404;
				} else if (errorCodes.includes(ErrorCode.RATE_LIMIT_EXCEEDED)) {
					statusCode = 429;
				} else {
					// Fall back to the first error's httpStatus or 500
					statusCode =
						(formattedErrors[0]?.extensions?.httpStatus as number) ?? 500;
				}
			}

			return {
				statusCode,
				response: {
					data: data ?? null,
					errors: formattedErrors,
				},
			};
		},
		subscription: {
			onConnect: async (data: SubscriptionConnectionData) => {
				const { payload, socket } = data;
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

					// Extract perf from socket.request.perf if available
					const perf =
						socket?.request &&
						"perf" in socket.request &&
						isPerformanceTracker(socket.request.perf)
							? socket.request.perf
							: undefined;

					return {
						cache: fastify.cache,
						currentClient: {
							isAuthenticated: true,
							user: decoded.user,
						},
						dataloaders: createDataloaders(
							fastify.drizzleClient,
							fastify.cache,
							perf,
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
						perf,
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

	// GraphQL operation tracing - create spans for each operation
	if (observabilityConfig.enabled) {
		const tracer = trace.getTracer("talawa-api");

		fastify.graphql.addHook(
			"preExecution",
			async (_schema, document, context) => {
				// Extract operation name from the document - avoid logging PII
				const operationDefinition = document.definitions.find(
					(def) => def.kind === "OperationDefinition",
				);
				const operationName =
					(operationDefinition &&
						"name" in operationDefinition &&
						operationDefinition.name?.value) ||
					"anonymous";
				const operationType =
					(operationDefinition &&
						"operation" in operationDefinition &&
						operationDefinition.operation) ||
					"unknown";

				// Start a span for the GraphQL operation
				const span = tracer.startSpan(`graphql:${operationName}`);
				span.setAttribute("graphql.operation.name", operationName);
				span.setAttribute("graphql.operation.type", operationType);

				// Store span on context for later cleanup
				(context as { _tracingSpan?: Span })._tracingSpan = span;
			},
		);

		fastify.graphql.addHook("onResolution", async (execution, context) => {
			// End the span created in preExecution
			const span = (context as { _tracingSpan?: Span })._tracingSpan;
			if (span) {
				// Record if there were errors (without logging error details/PII)
				if (execution.errors && execution.errors.length > 0) {
					span.setAttribute("graphql.errors.count", execution.errors.length);
				}
				span.end();
			}
		});
	}

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

			// Track GraphQL complexity score in performance tracker
			if (request.perf) {
				request.perf.trackComplexity(complexity.complexity);
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
					extensions: { code: ErrorCode.RATE_LIMIT_EXCEEDED },
				});
			}
		},
	);
});

export default graphql;
