import { describe, expect, it } from "vitest";
import { mutationUpdateCommentInputSchema } from "~/src/graphql/inputs/MutationUpdateCommentInput";

/**
 * Tests for MutationUpdateCommentInput schema validation.
 * Validates body field trimming and length constraints (min 1, max 2048).
 */
describe("MutationUpdateCommentInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		body: "Updated comment body",
	};

	describe("body field", () => {
		it("should accept valid body", () => {
			const result = mutationUpdateCommentInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from body", () => {
			const result = mutationUpdateCommentInputSchema.safeParse({
				...validInput,
				body: "  trimmed body  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.body).toBe("trimmed body");
			}
		});

		it("should reject whitespace-only body", () => {
			const result = mutationUpdateCommentInputSchema.safeParse({
				...validInput,
				body: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string body", () => {
			const result = mutationUpdateCommentInputSchema.safeParse({
				...validInput,
				body: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject body exceeding 2048 characters", () => {
			const result = mutationUpdateCommentInputSchema.safeParse({
				...validInput,
				body: "a".repeat(2049),
			});
			expect(result.success).toBe(false);
		});

		it("should accept body at exactly 2048 characters", () => {
			const result = mutationUpdateCommentInputSchema.safeParse({
				...validInput,
				body: "a".repeat(2048),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdateCommentInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("optional argument");
			}
		});
	});
});
