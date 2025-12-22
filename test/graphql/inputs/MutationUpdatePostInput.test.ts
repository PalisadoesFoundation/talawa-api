import { describe, expect, it } from "vitest";
import { POST_CAPTION_MAX_LENGTH } from "~/src/drizzle/tables/posts";
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

		it("should reject whitespace-only caption", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string caption", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject caption exceeding length limit", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "a".repeat(POST_CAPTION_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const hasLengthIssue = result.error.issues.some((issue) =>
					issue.message.includes(String(POST_CAPTION_MAX_LENGTH)),
				);
				expect(hasLengthIssue).toBe(true);
			}
		});

		it("should accept caption at exactly POST_CAPTION_MAX_LENGTH characters", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				...validInput,
				caption: "a".repeat(POST_CAPTION_MAX_LENGTH),
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
			if (!result.success) {
				const hasOptionalArgIssue = result.error.issues.some((issue) =>
					issue.message.includes("optional argument"),
				);
				expect(hasOptionalArgIssue).toBe(true);
			}
		});

		it("should accept update with only isPinned", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				isPinned: true,
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with only attachments", () => {
			const result = mutationUpdatePostInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				attachments: [
					{
						mimetype: "image/jpeg",
						objectName: "test.jpg",
						fileHash: "hash",
						name: "test.jpg",
					},
				],
			});
			expect(result.success).toBe(true);
		});
	});
});
