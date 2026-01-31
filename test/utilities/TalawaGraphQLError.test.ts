import { GraphQLError } from "graphql";
import { describe, expect, it } from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import {
	defaultTalawaGraphQLErrorMessages,
	TalawaGraphQLError,
	type TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";

describe("TalawaGraphQLError", () => {
	describe("constructor", () => {
		it("should create error with ErrorCode enum", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: ErrorCode.NOT_FOUND,
				},
			});

			expect(error).toBeInstanceOf(GraphQLError);
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect(error.extensions?.code).toBe(ErrorCode.NOT_FOUND);
			expect(error.message).toBe(
				defaultTalawaGraphQLErrorMessages[ErrorCode.NOT_FOUND],
			);
		});

		it("should create error with custom message", () => {
			const customMessage = "Custom user not found message";
			const error = new TalawaGraphQLError({
				message: customMessage,
				extensions: {
					code: ErrorCode.NOT_FOUND,
				},
			});

			expect(error.message).toBe(customMessage);
			expect(error.extensions?.code).toBe(ErrorCode.NOT_FOUND);
		});

		it("should create error with details", () => {
			const details = { userId: "123", organizationId: "456" };
			const error = new TalawaGraphQLError({
				extensions: {
					code: ErrorCode.NOT_FOUND,
					details,
				},
			});

			expect(error.extensions?.details).toEqual(details);
		});

		it("should create error with HTTP status override", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: ErrorCode.NOT_FOUND,
					httpStatus: 418,
				},
			});

			expect(error.extensions?.httpStatus).toBe(418);
		});

		it("should use default message for unknown error codes", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "unknown_code" as ErrorCode,
				},
			});

			expect(error.message).toBe("An error occurred");
		});
	});

	describe("legacy error codes", () => {
		it("should handle unauthenticated error", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});

			expect(error.message).toBe(
				"You must be authenticated to perform this action.",
			);
			expect(error.extensions?.code).toBe("unauthenticated");
		});

		it("should handle invalid_arguments with issues", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["input", "age"],
							message: "Must be greater than 18",
						},
						{
							argumentPath: ["input", "email"],
							message: "Must be a valid email",
						},
					],
				},
			});

			expect(error.message).toBe(
				"You have provided invalid arguments for this action.",
			);
			expect(error.extensions?.issues).toHaveLength(2);
		});

		it("should handle arguments_associated_resources_not_found", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [
						{
							argumentPath: ["input", 0, "id"],
						},
						{
							argumentPath: ["input", 3, "id"],
						},
					],
				},
			});

			expect(error.message).toBe(
				"No associated resources found for the provided arguments.",
			);
			expect(error.extensions?.issues).toHaveLength(2);
		});

		it("should handle forbidden_action_on_arguments_associated_resources", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "emailAddress"],
							message: "This email address is not available.",
						},
					],
				},
			});

			expect(error.message).toBe(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
			expect(error.extensions?.issues).toHaveLength(1);
		});

		it("should handle account_locked with retryAfter", () => {
			const retryAfter = new Date(Date.now() + 900000).toISOString();
			const error = new TalawaGraphQLError({
				extensions: {
					code: "account_locked",
					retryAfter,
				},
			});

			expect(error.message).toBe(
				"Account temporarily locked due to too many failed login attempts. Please try again later.",
			);
			expect(error.extensions?.retryAfter).toBe(retryAfter);
		});

		it("should handle invalid_credentials", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "invalid_credentials",
					issues: [
						{
							argumentPath: ["input"],
							message: "Invalid email address or password.",
						},
					],
				},
			});

			expect(error.message).toBe("Invalid email address or password.");
			expect(error.extensions?.issues).toHaveLength(1);
		});

		it("should handle unauthorized_action_on_arguments_associated_resources", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "id"],
						},
					],
				},
			});

			expect(error.message).toBe(
				"You are not authorized to perform this action on the resources associated to the provided arguments.",
			);
		});

		it("should handle unauthorized_arguments", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_arguments",
					issues: [
						{
							argumentPath: ["input", "role"],
						},
					],
				},
			});

			expect(error.message).toBe(
				"You are not authorized to perform this action with the provided arguments.",
			);
		});

		it("should handle too_many_requests", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "too_many_requests",
				},
			});

			expect(error.message).toBe("Too many requests. Please try again later.");
		});

		it("should handle unexpected errors", () => {
			const error = new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});

			expect(error.message).toBe(
				"Something went wrong. Please try again later.",
			);
		});
	});

	describe("ErrorCode enum integration", () => {
		const testCases = [
			{
				code: ErrorCode.UNAUTHENTICATED,
				expectedMessage: "You must be authenticated to perform this action.",
			},
			{
				code: ErrorCode.TOKEN_EXPIRED,
				expectedMessage: "Authentication token has expired.",
			},
			{
				code: ErrorCode.TOKEN_INVALID,
				expectedMessage: "Authentication token is invalid.",
			},
			{
				code: ErrorCode.UNAUTHORIZED,
				expectedMessage: "Unauthorized access.",
			},
			{
				code: ErrorCode.INSUFFICIENT_PERMISSIONS,
				expectedMessage: "Insufficient permissions.",
			},
			{
				code: ErrorCode.INVALID_ARGUMENTS,
				expectedMessage: "You have provided invalid arguments for this action.",
			},
			{
				code: ErrorCode.INVALID_INPUT,
				expectedMessage: "Invalid input provided.",
			},
			{
				code: ErrorCode.NOT_FOUND,
				expectedMessage: "Requested resource not found.",
			},
			{
				code: ErrorCode.ALREADY_EXISTS,
				expectedMessage: "Resource already exists.",
			},
			{
				code: ErrorCode.CONFLICT,
				expectedMessage: "Conflict with existing resource.",
			},
			{
				code: ErrorCode.RATE_LIMIT_EXCEEDED,
				expectedMessage: "Rate limit exceeded.",
			},
			{
				code: ErrorCode.DEPRECATED,
				expectedMessage: "Requested resource or operation is deprecated.",
			},
			{
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				expectedMessage: "Something went wrong. Please try again later.",
			},
			{
				code: ErrorCode.DATABASE_ERROR,
				expectedMessage: "Database operation failed. Please try again later.",
			},
			{
				code: ErrorCode.EXTERNAL_SERVICE_ERROR,
				expectedMessage:
					"External service unavailable. Please try again later.",
			},
			{
				code: ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
				expectedMessage:
					"No associated resources found for the provided arguments.",
			},
			{
				code: ErrorCode.FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
				expectedMessage:
					"This action is forbidden on the resources associated to the provided arguments.",
			},
			{
				code: ErrorCode.FORBIDDEN_ACTION,
				expectedMessage: "This action is forbidden.",
			},
			{
				code: ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
				expectedMessage:
					"You are not authorized to perform this action on the resources associated to the provided arguments.",
			},
			{
				code: ErrorCode.UNEXPECTED,
				expectedMessage: "Something went wrong. Please try again later.",
			},
		];

		testCases.forEach(({ code, expectedMessage }) => {
			it(`should handle ${code} with correct default message`, () => {
				const error = new TalawaGraphQLError({
					extensions: { code },
				});

				expect(error.message).toBe(expectedMessage);
				expect(error.extensions?.code).toBe(code);
			});
		});
	});

	describe("GraphQL integration", () => {
		it("should preserve GraphQL error properties", () => {
			const error = new TalawaGraphQLError({
				message: "Custom error message",
				extensions: {
					code: ErrorCode.NOT_FOUND,
					details: { resourceId: "123" },
				},
			});

			// Should have GraphQL error properties
			expect(error.message).toBe("Custom error message");
			expect(error.name).toBe("GraphQLError");
			expect(error.extensions).toBeDefined();
			expect(error.source).toBeUndefined(); // Not set in constructor
			expect(error.positions).toBeUndefined(); // Not set in constructor
			expect(error.path).toBeUndefined(); // Not set in constructor
			expect(error.nodes).toBeUndefined(); // Not set in constructor
		});

		it("should be throwable in GraphQL resolvers", () => {
			const throwError = () => {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.UNAUTHENTICATED,
					},
				});
			};

			expect(throwError).toThrow(TalawaGraphQLError);
			expect(throwError).toThrow(GraphQLError);
		});
	});
});

describe("defaultTalawaGraphQLErrorMessages", () => {
	it("should have messages for all legacy error codes", () => {
		const legacyCodes = [
			"account_locked",
			"arguments_associated_resources_not_found",
			"forbidden_action",
			"forbidden_action_on_arguments_associated_resources",
			"invalid_arguments",
			"invalid_credentials",
			"unauthenticated",
			"unauthorized_action",
			"unauthorized_action_on_arguments_associated_resources",
			"unauthorized_arguments",
			"unexpected",
			"too_many_requests",
		];

		legacyCodes.forEach((code) => {
			const message =
				defaultTalawaGraphQLErrorMessages[
					code as keyof typeof defaultTalawaGraphQLErrorMessages
				];
			expect(message).toBeDefined();
			expect(typeof message).toBe("string");
			expect(message?.length).toBeGreaterThan(0);
		});
	});

	it("should have messages for all ErrorCode enum values", () => {
		Object.values(ErrorCode).forEach((code) => {
			const message = defaultTalawaGraphQLErrorMessages[code];
			expect(message).toBeDefined();
			expect(typeof message).toBe("string");
			expect(message?.length).toBeGreaterThan(0);
		});
	});

	it("should have unique messages for different error codes", () => {
		const messages = Object.values(defaultTalawaGraphQLErrorMessages);
		const messageCounts = new Map<string, number>();

		messages.forEach((msg) => {
			messageCounts.set(msg, (messageCounts.get(msg) || 0) + 1);
		});

		// Identify messages that appear more than once
		const duplicates = Array.from(messageCounts.entries())
			.filter(([_, count]) => count > 1)
			.map(([msg]) => msg);

		// Define allowed duplicates (e.g. generic error messages)
		const allowedDuplicates = ["Something went wrong. Please try again later."];

		// Assert that only allowed duplicates are present
		const unexpectedDuplicates = duplicates.filter(
			(msg) => !allowedDuplicates.includes(msg),
		);

		expect(unexpectedDuplicates).toEqual([]);
	});
});

describe("TalawaGraphQLFormattedError type", () => {
	it("should accept valid formatted error", () => {
		const formattedError: TalawaGraphQLFormattedError = {
			message: "User not found",
			path: ["user"],
			extensions: {
				code: ErrorCode.NOT_FOUND,
				details: { userId: "123" },
				httpStatus: 404,
			},
		};

		expect(formattedError.message).toBe("User not found");
		expect(formattedError.path).toEqual(["user"]);
		expect(formattedError.extensions.code).toBe(ErrorCode.NOT_FOUND);
		expect(formattedError.extensions.details).toEqual({ userId: "123" });
		expect(formattedError.extensions.httpStatus).toBe(404);
	});

	it("should accept legacy error code format", () => {
		const formattedError: TalawaGraphQLFormattedError = {
			message: "Invalid arguments provided",
			extensions: {
				code: "invalid_arguments",
				issues: [
					{
						argumentPath: ["input", "age"],
						message: "Must be greater than 18",
					},
				],
			},
		};

		expect(formattedError.extensions.code).toBe("invalid_arguments");
		expect(formattedError.extensions.issues).toHaveLength(1);
	});
});
