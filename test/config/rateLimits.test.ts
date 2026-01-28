import { describe, expect, it } from "vitest";
import { getTier, rateLimitTiers } from "~/src/config/rateLimits";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

describe("rateLimits config", () => {
	describe("getTier", () => {
		it("should return the correct tier for valid names", () => {
			expect(getTier("normal")).toEqual(rateLimitTiers.normal);
			expect(getTier("open")).toEqual(rateLimitTiers.open);
			expect(getTier("auth")).toEqual(rateLimitTiers.auth);
		});

		it("should throw TalawaRestError for invalid tier names", () => {
			const invalidName = "nonexistent";

			try {
				// @ts-expect-error Testing runtime validation for invalid input
				getTier(invalidName);
				// Fail test if no error is thrown
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaRestError);
				const restError = error as TalawaRestError;
				expect(restError.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
				expect(restError.message).toContain(
					`Rate limit tier '${invalidName}' not found in configuration`,
				);
				expect(restError.statusCode).toBe(500);
			}
		});
	});
});
