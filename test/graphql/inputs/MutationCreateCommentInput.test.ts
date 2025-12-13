import { describe, expect, it } from "vitest";
import { COMMENT_BODY_MAX_LENGTH } from "~/src/drizzle/tables/comments";
import { mutationCreateCommentInputSchema } from "~/src/graphql/inputs/MutationCreateCommentInput";

/**
 * Tests for MutationCreateCommentInput schema validation.
 * Validates body field trimming and length constraints (min 1, max COMMENT_BODY_MAX_LENGTH).
 */
describe("MutationCreateCommentInput Schema", () => {
	const validInput = {
		postId: "550e8400-e29b-41d4-a716-446655440000",
		body: "Valid comment body",
	};

	describe("body field", () => {
		it("should accept valid body", () => {
			const result = mutationCreateCommentInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from body", () => {
			const result = mutationCreateCommentInputSchema.safeParse({
				...validInput,
				body: "  trimmed body  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.body).toBe("trimmed body");
			}
		});

		it("should reject whitespace-only body", () => {
			const result = mutationCreateCommentInputSchema.safeParse({
				...validInput,
				body: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string body", () => {
			const result = mutationCreateCommentInputSchema.safeParse({
				...validInput,
				body: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject body exceeding max length", () => {
			const result = mutationCreateCommentInputSchema.safeParse({
				...validInput,
				body: "a".repeat(COMMENT_BODY_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept body at exactly max length", () => {
			const result = mutationCreateCommentInputSchema.safeParse({
				...validInput,
				body: "a".repeat(COMMENT_BODY_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});

		it("should accept minimum length body (1 character)", () => {
			const result = mutationCreateCommentInputSchema.safeParse({
				...validInput,
				body: "a",
			});
			expect(result.success).toBe(true);
		});
	});
});
