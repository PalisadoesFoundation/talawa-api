import type { Readable } from "node:stream";
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
		it("should accept valid caption", async () => {
			const result =
				await mutationUpdatePostInputSchema.safeParseAsync(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from caption", async () => {
			const result = await mutationUpdatePostInputSchema.safeParseAsync({
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

		it("should accept caption at exactly POST_CAPTION_MAX_LENGTH characters", async () => {
			const result = await mutationUpdatePostInputSchema.safeParseAsync({
				...validInput,
				caption: "a".repeat(POST_CAPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", async () => {
			const result = await mutationUpdatePostInputSchema.safeParseAsync({
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

		it("should accept update with only isPinned", async () => {
			const result = await mutationUpdatePostInputSchema.safeParseAsync({
				id: "550e8400-e29b-41d4-a716-446655440000",
				isPinned: true,
			});
			expect(result.success).toBe(true);
		});
	});
	describe("attachment field", () => {
		it("should reject attachment with invalid mime type", async () => {
			const invalidMimeTypeAttachment = Promise.resolve({
				filename: "test.exe",
				mimetype: "application/x-msdownload", // Invalid mime type
				encoding: "7bit",
				createReadStream: () => null as unknown as Readable,
			});

			const result = await mutationUpdatePostInputSchema.safeParseAsync({
				id: "550e8400-e29b-41d4-a716-446655440000",
				attachment: invalidMimeTypeAttachment,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((i) => i.path.join(".") === "attachment"),
				).toBe(true);
				expect(result.error.issues[0]?.message).toContain("not allowed");
			}
		});

		it("should accept attachment with valid mime type", async () => {
			const validMimeTypeAttachment = Promise.resolve({
				filename: "test.jpg",
				mimetype: "image/jpeg", // Valid mime type
				encoding: "7bit",
				createReadStream: () => null as unknown as Readable,
			});

			const result = await mutationUpdatePostInputSchema.safeParseAsync({
				id: "550e8400-e29b-41d4-a716-446655440000",
				attachment: validMimeTypeAttachment,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeDefined();
				expect(result.data.attachment?.mimetype).toBe("image/jpeg");
			}
		});

		it("should set attachment to be undefined when explicitly undefined", async () => {
			const result = await mutationUpdatePostInputSchema.safeParseAsync({
				id: "550e8400-e29b-41d4-a716-446655440000",
				attachment: undefined,
				caption: "Update with undefined attachment",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeUndefined();
			}
		});

		it("should accept missing attachment field", async () => {
			const result = await mutationUpdatePostInputSchema.safeParseAsync({
				id: "550e8400-e29b-41d4-a716-446655440000",
				caption: "Update without attachment",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeUndefined();
			}
		});
	});
});
