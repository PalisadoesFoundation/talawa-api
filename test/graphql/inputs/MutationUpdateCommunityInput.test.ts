import { describe, expect, it } from "vitest";
import { mutationUpdateCommunityInputSchema } from "~/src/graphql/inputs/MutationUpdateCommunityInput";

/**
 * Tests for MutationUpdateCommunityInput schema validation.
 * Validates name field trimming and URL validations.
 */
describe("MutationUpdateCommunityInput Schema", () => {
	const validInput = {
		name: "Updated Community Name",
	};

	describe("name field", () => {
		it("should accept valid name", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should allow name to be optional", () => {
			const inputWithoutName = {
				websiteURL: "https://example.com",
			};
			const result =
				mutationUpdateCommunityInputSchema.safeParse(inputWithoutName);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBeUndefined();
			}
		});

		it("should trim whitespace from name", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				name: "  trimmed name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("trimmed name");
			}
		});

		it("should accept whitespace-only name (trimmed to empty)", () => {
			// Note: Schema trims name but has no min length, so whitespace becomes empty string
			const result = mutationUpdateCommunityInputSchema.safeParse({
				name: "   ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("");
			}
		});
	});

	describe("URL fields", () => {
		// Define URL fields with their valid test URLs
		const urlFields = [
			{ field: "facebookURL", validUrl: "https://facebook.com/community" },
			{ field: "githubURL", validUrl: "https://github.com/community" },
			{ field: "instagramURL", validUrl: "https://instagram.com/community" },
			{
				field: "linkedinURL",
				validUrl: "https://linkedin.com/company/community",
			},
			{ field: "websiteURL", validUrl: "https://community.org" },
		] as const;

		describe.each(urlFields)("$field", ({ field, validUrl }) => {
			it("should accept valid URL", () => {
				const result = mutationUpdateCommunityInputSchema.safeParse({
					[field]: validUrl,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid URL string", () => {
				const result = mutationUpdateCommunityInputSchema.safeParse({
					[field]: "not-a-valid-url",
				});
				expect(result.success).toBe(false);
			});

			it("should accept null value", () => {
				const result = mutationUpdateCommunityInputSchema.safeParse({
					[field]: null,
				});
				expect(result.success).toBe(true);
			});
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({});
			expect(result.success).toBe(false);
			if (!result.success) {
				// Assert that at least one issue contains the expected message
				const hasOptionalArgIssue = result.error.issues.some((issue) =>
					issue.message.includes("optional argument"),
				);
				expect(hasOptionalArgIssue).toBe(true);
			}
		});
	});
});
