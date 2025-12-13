import { describe, expect, it } from "vitest";
import { mutationUpdatePostInputSchema } from "~/src/graphql/inputs/MutationUpdatePostInput";

/**
 * Tests for MutationUpdatePostInput schema validation.
 * Validates caption field trimming and length constraints.
 */
describe("MutationUpdatePostInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		caption: "Updated post caption",
	};

	describe("caption field", () => {
		it("should accept valid caption", () => {
			const result = mutationUpdatePostInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from caption", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
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
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "   ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.caption).toBe("");
			}
		});

		it("should reject empty string caption", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject caption exceeding 2000 characters", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "a".repeat(2001),
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("2000");
			}
		});

		it("should accept caption at exactly 2000 characters", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "a".repeat(2000),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("optional argument");
			}
		});
	});
});
