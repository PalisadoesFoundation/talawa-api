import { describe, expect, it } from "vitest";
import { POST_CAPTION_MAX_LENGTH } from "~/src/drizzle/tables/posts";
import { mutationCreatePostInputSchema } from "~/src/graphql/inputs/MutationCreatePostInput";

/**
 * Tests for MutationCreatePostInput schema validation.
 * Validates caption field trimming and length constraints.
 */
describe("MutationCreatePostInput Schema", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		caption: "Valid post caption",
	};

	describe("caption field", () => {
		it("should reject empty string caption", () => {
			// Schema has .min(1) on caption, so empty strings are rejected
			const result = mutationCreatePostInputSchema.safeParse({
				...validInput,
				caption: "",
			});
			expect(result.success).toBe(false);
		});
		it("should accept valid caption", () => {
			const result = mutationCreatePostInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from caption", () => {
			const result = mutationCreatePostInputSchema.safeParse({
				...validInput,
				caption: "  trimmed caption  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.caption).toBe("trimmed caption");
			}
		});

		it("should accept whitespace-only caption (trimmed to empty)", () => {
			// Note: Post schema doesn't have min length, so empty caption after trim is valid
			const result = mutationCreatePostInputSchema.safeParse({
				...validInput,
				caption: "   ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.caption).toBe("");
			}
		});

		it("should reject caption exceeding 2000 characters", () => {
			const result = mutationCreatePostInputSchema.safeParse({
				...validInput,
				caption: "a".repeat(POST_CAPTION_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain(
					String(POST_CAPTION_MAX_LENGTH),
				);
			}
		});

		it("should accept caption at exactly 2000 characters", () => {
			const result = mutationCreatePostInputSchema.safeParse({
				...validInput,
				caption: "a".repeat(POST_CAPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});
});
