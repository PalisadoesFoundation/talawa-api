import { expect, suite, test } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { firstOrThrow } from "~/src/lib/dbHelpers";

suite("firstOrThrow", () => {
	suite("success cases - arrays", () => {
		test("should return the first element from an array with one element", () => {
			const rows = [{ id: "1", name: "Test" }];
			const result = firstOrThrow(rows);
			expect(result).toEqual({ id: "1", name: "Test" });
		});

		test("should return the first element from an array with multiple elements", () => {
			const rows = [
				{ id: "1", name: "First" },
				{ id: "2", name: "Second" },
				{ id: "3", name: "Third" },
			];
			const result = firstOrThrow(rows);
			expect(result).toEqual({ id: "1", name: "First" });
		});
	});

	suite("success cases - single objects", () => {
		test("should return a single object when passed a non-array object", () => {
			const row = { id: "1", name: "Test" };
			const result = firstOrThrow(row);
			expect(result).toEqual({ id: "1", name: "Test" });
		});

		test("should return an object with falsy properties without throwing", () => {
			const row = { value: 0, flag: false, empty: "", nullProp: null };
			const result = firstOrThrow(row);
			expect(result).toEqual({ value: 0, flag: false, empty: "", nullProp: null });
		});
	});

	suite("error cases - empty/null/undefined", () => {
		test("should throw TalawaGraphQLError with default message when array is empty", () => {
			const rows: unknown[] = [];
			expect(() => firstOrThrow(rows)).toThrow(TalawaGraphQLError);
			try {
				firstOrThrow(rows);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				if (error instanceof TalawaGraphQLError) {
					expect(error.extensions.code).toBe("unexpected");
					expect(error.message).toBe("Unexpected DB operation failure");
				}
			}
		});

		test("should throw TalawaGraphQLError with default message when value is null", () => {
			expect(() => firstOrThrow(null)).toThrow(TalawaGraphQLError);
			try {
				firstOrThrow(null);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				if (error instanceof TalawaGraphQLError) {
					expect(error.extensions.code).toBe("unexpected");
					expect(error.message).toBe("Unexpected DB operation failure");
				}
			}
		});

		test("should throw TalawaGraphQLError with default message when value is undefined", () => {
			expect(() => firstOrThrow(undefined)).toThrow(TalawaGraphQLError);
			try {
				firstOrThrow(undefined);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				if (error instanceof TalawaGraphQLError) {
					expect(error.extensions.code).toBe("unexpected");
					expect(error.message).toBe("Unexpected DB operation failure");
				}
			}
		});
	});

	suite("error cases - custom message", () => {
		test("should throw TalawaGraphQLError with custom message when provided", () => {
			const customMessage = "Action item creation failed";
			expect(() => firstOrThrow([], customMessage)).toThrow(TalawaGraphQLError);
			try {
				firstOrThrow([], customMessage);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				if (error instanceof TalawaGraphQLError) {
					expect(error.extensions.code).toBe("unexpected");
					expect(error.message).toBe(customMessage);
				}
			}
		});

		test("should throw TalawaGraphQLError with custom message for null", () => {
			const customMessage = "Custom error message for null";
			expect(() => firstOrThrow(null, customMessage)).toThrow(TalawaGraphQLError);
			try {
				firstOrThrow(null, customMessage);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				if (error instanceof TalawaGraphQLError) {
					expect(error.extensions.code).toBe("unexpected");
					expect(error.message).toBe(customMessage);
				}
			}
		});

		test("should throw TalawaGraphQLError with custom message for undefined", () => {
			const customMessage = "Custom error message for undefined";
			expect(() => firstOrThrow(undefined, customMessage)).toThrow(TalawaGraphQLError);
			try {
				firstOrThrow(undefined, customMessage);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				if (error instanceof TalawaGraphQLError) {
					expect(error.extensions.code).toBe("unexpected");
					expect(error.message).toBe(customMessage);
				}
			}
		});
	});
});

