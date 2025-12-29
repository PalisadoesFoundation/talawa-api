import {
	GraphQLError,
	type GraphQLErrorOptions,
	type GraphQLFormattedError,
} from "graphql";
import type { ErrorCode } from "./errors/errorCodes";

// The term action used below is used to refer to read and write operations triggered by the clients. In the context of graphql query, mutation and subscription are the three possible ways to perform these actions.

// The term resource used below is used to refer to any entity that the client can perform an action on. These can be both coarse and fine grained entities. One example for a coarse grained entity would be the account of a user and one example for a fine grained entity would be the email address of a user.

/**
 * When resources associated to the provided graphql arguments cannot be not found.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "arguments_associated_resources_not_found",
 * 		issues: [
 * 			{
 * 				argumentPath: ["input", 0, "id"],
 * 			},
 * 			{
 * 				argumentPath: ["input", 3, "id"],
 * 			},
 * 			{
 * 				argumentPath: ["input", 19, "id"],
 * 			},
 * 		],
 * 	},
 * });
 */
export type ArgumentsAssociatedResourcesNotFoundExtensions = {
	code: "arguments_associated_resources_not_found";
	issues: {
		argumentPath: (string | number)[];
	}[];
};

/**
 * When the user's account is temporarily locked due to too many failed login attempts.
 * The retryAfter field indicates when the account will be unlocked (ISO 8601 timestamp).
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "account_locked",
 * 		retryAfter: new Date(Date.now() + 900000).toISOString(),
 * 	},
 * });
 */
export type AccountLockedExtensions = {
	code: "account_locked";
	retryAfter: string;
};

/**
 * When the client tries to perform an action that conflicts with real world expectations of the application.
 *
 * @example
 * throw new TalawaGraphQLError(
 * 	{
 * 		extensions: {
 * 			code: "forbidden_action",
 * 		},
 * 	},
 * );
 */
export type ForbiddenActionExtensions = {
	code: "forbidden_action";
};

/**
 * When the client tries to perform actions on resources associated to arguments that conflict with real world expectations of the application. One example would be a user trying to follow their own account on a social media application.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "forbidden_action_on_arguments_associated_resources",
 * 		issues: [
 * 			{
 * 				argumentPath: ["input", 0, "emailAddress"],
 * 				message: "This email address is not available.",
 * 			},
 * 			{
 * 				argumentPath: ["input", 3, "username"],
 * 				message: "This username is not available.",
 * 			},
 * 		],
 * 	},
 * });
 */
export type ForbiddenActionOnArgumentsAssociatedResourcesExtensions = {
	code: "forbidden_action_on_arguments_associated_resources";
	issues: {
		argumentPath: (string | number)[];
		message: string;
	}[];
};

/**
 * When the client must be authenticated to perform an action.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "unauthenticated",
 * 	},
 * });
 */
export type UnauthenticatedExtensions = {
	code: "unauthenticated";
};

/**
 * When the client provides invalid arguments in a graphql operation.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "invalid_arguments",
 * 		issues: [
 * 			{
 * 				argumentPath: ["input", "age"],
 * 				message: "Must be greater than 18.",
 * 			},
 * 			{
 * 				argumentPath: ["input", "username"],
 * 				message: "Must be smaller than or equal to 25 characters.",
 * 			},
 * 			{
 * 				argumentPath: ["input", "favoriteFood", 2],
 * 				message: "Must be at least 1 character long.",
 * 			},
 * 		],
 * 	},
 * });
 */
export type InvalidArgumentsExtensions = {
	code: "invalid_arguments";
	issues: {
		argumentPath: (string | number)[];
		message: string;
	}[];
};

/**
 * When the client provides invalid credentials (email/password) during authentication.
 * This error is intentionally vague to prevent user enumeration attacks.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "invalid_credentials",
 * 		issues: [
 * 			{
 * 				argumentPath: ["input"],
 * 				message: "Invalid email address or password.",
 * 			},
 * 		],
 * 	},
 * });
 */
export type InvalidCredentialsExtensions = {
	code: "invalid_credentials";
	issues: {
		argumentPath: (string | number)[];
		message: string;
	}[];
};

/**
 * When the client is not authorized to perform an action.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "unauthorized_action",
 * 	},
 * });
 */
export type UnauthorizedActionExtensions = {
	code: "unauthorized_action";
};

/**
 * When the client is not authorized to perform an action on a resource associated to an argument.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "unauthorized_action_on_arguments_associated_resources",
 * 		issues: [
 * 			{
 * 				argumentPath: ["input", "id"],
 * 			},
 * 		],
 * 	},
 * });
 */
export type UnauthorizedActionOnArgumentsAssociatedResourcesExtensions = {
	issues: {
		argumentPath: (string | number)[];
	}[];
	code: "unauthorized_action_on_arguments_associated_resources";
};

/**
 * When the client is not authorized to perform an action with certain arguments.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "unauthorized_arguments",
 * 		issues: [
 * 			{
 * 				argumentPath: ["input", "role"],
 * 				message: "You are not authorzied to change your user role.",
 * 			},
 * 		],
 * 	},
 * });
 */
export type UnauthorizedArgumentsExtensions = {
	issues: {
		argumentPath: (string | number)[];
	}[];
	code: "unauthorized_arguments";
};

/**
 * When an error that doesn't fit one of the error types listed above occurs. One example would be a database request failure.
 *
 * @example
 * throw new TalawaGraphQLError({
 * 	extensions: {
 * 		code: "unexpected",
 * 	},
 * });
 */
export type UnexpectedExtensions = {
	code: "unexpected";
};
export type TooManyRequestsExtensions = {
	code: "too_many_requests";
};
export type TalawaGraphQLErrorExtensions =
	| AccountLockedExtensions
	| ArgumentsAssociatedResourcesNotFoundExtensions
	| ForbiddenActionExtensions
	| ForbiddenActionOnArgumentsAssociatedResourcesExtensions
	| UnauthenticatedExtensions
	| InvalidArgumentsExtensions
	| InvalidCredentialsExtensions
	| UnauthorizedActionExtensions
	| UnauthorizedActionOnArgumentsAssociatedResourcesExtensions
	| UnauthorizedArgumentsExtensions
	| UnexpectedExtensions
	| TooManyRequestsExtensions
	| {
			code: ErrorCode;
			details?: unknown;
			httpStatus?: number;
	  };

export const defaultTalawaGraphQLErrorMessages: Record<string, string> = {
	account_locked:
		"Account temporarily locked due to too many failed login attempts. Please try again later.",
	arguments_associated_resources_not_found:
		"No associated resources found for the provided arguments.",
	forbidden_action: "This action is forbidden.",
	forbidden_action_on_arguments_associated_resources:
		"This action is forbidden on the resources associated to the provided arguments.",
	invalid_arguments: "You have provided invalid arguments for this action.",
	invalid_credentials: "Invalid email address or password.",
	unauthenticated: "You must be authenticated to perform this action.",
	unauthorized_action: "You are not authorized to perform this action.",
	unauthorized_action_on_arguments_associated_resources:
		"You are not authorized to perform this action on the resources associated to the provided arguments.",
	unauthorized_arguments:
		"You are not authorized to perform this action with the provided arguments.",
	unexpected: "Something went wrong. Please try again later.",
	too_many_requests: "Too many requests. Please try again later.",
};

/**
 * Custom GraphQL error class that provides structured error handling with typed extensions.
 *
 * This class extends the standard GraphQLError and enforces strict TypeScript typing
 * on error metadata within the `extensions` field. It prevents arbitrary, undocumented
 * errors from being returned to GraphQL clients and standardizes error responses.
 *
 * The class integrates with the unified error handling system by supporting ErrorCode
 * enum values and providing consistent error shapes across REST and GraphQL endpoints.
 *
 * @example
 * ```ts
 * // Basic authentication error
 * throw new TalawaGraphQLError({
 *   extensions: {
 *     code: ErrorCode.UNAUTHENTICATED
 *   }
 * });
 *
 * // Error with details and custom message
 * throw new TalawaGraphQLError({
 *   message: "Organization not found",
 *   extensions: {
 *     code: ErrorCode.NOT_FOUND,
 *     details: { organizationId: "123" }
 *   }
 * });
 *
 * // Legacy typed extension (for backward compatibility)
 * throw new TalawaGraphQLError({
 *   extensions: {
 *     code: "arguments_associated_resources_not_found",
 *     issues: [
 *       { argumentPath: ["input", "id"] }
 *     ]
 *   }
 * });
 * ```
 *
 * The following example shows usage within a GraphQL resolver:
 * ```ts
 * export const user = async (parent, args, ctx) => {
 *   const existingUser = await ctx.drizzleClient.query.user.findFirst({
 *     where: (fields, operators) => operators.eq(fields.id, args.input.id),
 *   });
 *
 *   if (user === undefined) {
 *     throw new TalawaGraphQLError({
 *       extensions: {
 *         code: ErrorCode.NOT_FOUND,
 *         details: { userId: args.input.id }
 *       }
 *     });
 *   }
 *
 *   return user;
 * }
 * ```
 */
export class TalawaGraphQLError extends GraphQLError {
	/**
	 * Creates a new TalawaGraphQLError instance.
	 *
	 * @param options - Error configuration object
	 * @param options.message - Optional custom error message (uses default if not provided)
	 * @param options.extensions - Typed error extensions containing error code and details
	 * @param options.extensions.code - Error code (ErrorCode enum or legacy string codes)
	 * @param options.extensions.details - Optional additional error context
	 * @param options.extensions.httpStatus - Optional HTTP status code override
	 */
	constructor({
		message,
		...options
	}: GraphQLErrorOptions & {
		extensions: TalawaGraphQLErrorExtensions;
		message?: string;
	}) {
		if (message === undefined) {
			message =
				defaultTalawaGraphQLErrorMessages[options.extensions.code] ??
				"An error occurred";
		}
		super(message ?? "An error occurred", options);
	}
}

/**
 * Formatted error type returned by Talawa API's GraphQL implementation.
 *
 * This type extends the standard GraphQLFormattedError with typed extensions
 * that include structured error metadata for consistent client-side error handling.
 *
 * @example
 * ```json
 * {
 *   "message": "User not found",
 *   "path": ["user"],
 *   "extensions": {
 *     "code": "not_found",
 *     "details": { "userId": "123" },
 *     "correlationId": "req-abc123",
 *     "httpStatus": 404
 *   }
 * }
 * ```
 */
export type TalawaGraphQLFormattedError = GraphQLFormattedError & {
	/** Typed error extensions with structured metadata */
	extensions: TalawaGraphQLErrorExtensions;
};
