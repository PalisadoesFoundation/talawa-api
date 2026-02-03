import { describe, expect, it } from "vitest";
import { extractZodMessage, getPublicErrorMessage } from "~/src/routes/graphql";

describe("src/routes/graphql.ts unit tests", () => {
	describe("getPublicErrorMessage", () => {
		const DEFAULT_MSG = "DEFAULT";

		it("should return allowlisted messages exactly", () => {
			const allowed = [
				"Minio removal error",
				"An error occurred while fetching users",
				"An error occurred while fetching events",
				"Invalid UUID",
				"database_error",
			];

			for (const msg of allowed) {
				expect(getPublicErrorMessage({ message: msg }, DEFAULT_MSG)).toBe(msg);
			}
		});

		it("should normalize allowlisted messages with trailing periods", () => {
			// "Invalid UUID." -> "Invalid UUID"
			expect(
				getPublicErrorMessage({ message: "Invalid UUID." }, DEFAULT_MSG),
			).toBe("Invalid UUID");
		});

		it("should mask sensitive messages", () => {
			const sensitive = [
				"Database connection failed",
				"Error in query: select *",
				"Application goes boom",
			];

			for (const msg of sensitive) {
				expect(getPublicErrorMessage({ message: msg }, DEFAULT_MSG)).toBe(
					DEFAULT_MSG,
				);
			}
		});

		it("should return default message for unknown messages", () => {
			expect(
				getPublicErrorMessage({ message: "Some unknown error" }, DEFAULT_MSG),
			).toBe(DEFAULT_MSG);
		});

		it("should return default message for undefined/empty message", () => {
			expect(getPublicErrorMessage({}, DEFAULT_MSG)).toBe(DEFAULT_MSG);
			expect(getPublicErrorMessage({ message: "" }, DEFAULT_MSG)).toBe(
				DEFAULT_MSG,
			);
		});
	});

	describe("extractZodMessage", () => {
		const FALLBACK = "Fallback message";

		it("should fallback when treeified details don't contain UUID error", () => {
			const details = {
				properties: {
					id: {
						errors: ["Some other validation error"],
					},
				},
			};
			expect(extractZodMessage(details, {}, FALLBACK)).toBe(FALLBACK);
		});

		it("should handle treeified details with Invalid UUID", () => {
			const details = {
				properties: {
					id: {
						errors: ["Invalid UUID"],
					},
				},
			};
			expect(extractZodMessage(details, {}, FALLBACK)).toBe("Invalid uuid");
		});

		it("should handle array details with Invalid UUID", () => {
			const details = [{ message: "Invalid UUID" }];
			expect(extractZodMessage(details, {}, FALLBACK)).toBe("Invalid uuid");
		});

		it("should handle array details with 'Invalid uuid' (lowercase)", () => {
			const details = [{ message: "Invalid uuid" }];
			expect(extractZodMessage(details, {}, FALLBACK)).toBe("Invalid uuid");
		});

		it("should handle array details with other messages", () => {
			const details = [{ message: "Some other error" }];
			expect(extractZodMessage(details, {}, FALLBACK)).toBe("Some other error");
		});

		it("should parse stringified JSON details", () => {
			const details = JSON.stringify([{ message: "Parsed error" }]);
			expect(extractZodMessage(details, {}, FALLBACK)).toBe("Parsed error");
		});

		it("should fallback to 'Invalid uuid' if parsing fails but message contains it", () => {
			const details = "invalid-json";
			const error = { message: "Something with Invalid UUID output" };
			expect(extractZodMessage(details, error, FALLBACK)).toBe("Invalid uuid");
		});

		it("should fallback to 'Invalid uuid' if parsing fails but originalError message contains it", () => {
			const details = "invalid-json";
			const error = {
				originalError: { message: "Original error with Invalid UUID" },
			};
			expect(extractZodMessage(details, error, FALLBACK)).toBe("Invalid uuid");
		});

		it("should fallback to getPublicErrorMessage for unknown cases", () => {
			const details = "invalid-json";
			const error = { message: "Unknown error" };
			// Since we can't easily spy on the internal getPublicErrorMessage call,
			// we assert that it returns the result consistent with getPublicErrorMessage logic.
			// "Unknown error" -> should return fallback (since it's not allowlisted)
			expect(extractZodMessage(details, error, FALLBACK)).toBe(FALLBACK);

			// Test with an allowlisted message in the error object, which getPublicErrorMessage passes through
			const allowlistedError = { message: "Minio removal error" };
			expect(extractZodMessage(details, allowlistedError, FALLBACK)).toBe(
				"Minio removal error",
			);
		});
	});
});
