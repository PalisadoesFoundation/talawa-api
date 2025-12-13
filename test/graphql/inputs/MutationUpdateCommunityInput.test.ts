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

		it("should trim whitespace from name", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				name: "  trimmed name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("trimmed name");
			}
		});

		it("should reject whitespace-only name", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				name: "   ",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("URL fields", () => {
		it("should accept valid URL for facebookURL", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				facebookURL: "https://facebook.com/community",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid URL for facebookURL", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				facebookURL: "not-a-valid-url",
			});
			expect(result.success).toBe(false);
		});

		it("should accept valid URL for githubURL", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				githubURL: "https://github.com/community",
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid URL for instagramURL", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				instagramURL: "https://instagram.com/community",
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid URL for linkedinURL", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				linkedinURL: "https://linkedin.com/company/community",
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid URL for websiteURL", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				websiteURL: "https://community.org",
			});
			expect(result.success).toBe(true);
		});

		it("should accept null URL values", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({
				facebookURL: null,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdateCommunityInputSchema.safeParse({});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("optional argument");
			}
		});
	});
});
