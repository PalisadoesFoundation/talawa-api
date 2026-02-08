import type { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
	POST_BODY_MAX_LENGTH,
	POST_CAPTION_MAX_LENGTH,
} from "~/src/drizzle/tables/posts";
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
			if (!result.success) {
				expect(
					result.error.issues.some((i) => i.path.join(".") === "caption"),
				).toBe(true);
			}
		});
		it("should accept valid caption", async () => {
			const result =
				await mutationCreatePostInputSchema.safeParseAsync(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from caption", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				caption: "  trimmed caption  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.caption).toBe("trimmed caption");
			}
		});

		it("should reject whitespace-only caption", () => {
			const result = mutationCreatePostInputSchema.safeParse({
				...validInput,
				caption: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject caption exceeding length limit", () => {
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

		it("should accept caption at exactly POST_CAPTION_MAX_LENGTH characters", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				caption: "a".repeat(POST_CAPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("body field", () => {
		it("should accept valid body", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				body: "This is a valid body content.",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.body).toBe("This is a valid body content.");
			}
		});

		it("should trim whitespace from body", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				body: "  trimmed body content  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.body).toBe("trimmed body content");
			}
		});

		it("should reject body exceeding max length", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				body: "a".repeat(POST_BODY_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain(
					String(POST_BODY_MAX_LENGTH),
				);
			}
		});

		it("should accept body at exactly POST_BODY_MAX_LENGTH characters", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				body: "a".repeat(POST_BODY_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});

		it("should accept missing body (optional field)", async () => {
			// Test that body field is optional
			const result =
				await mutationCreatePostInputSchema.safeParseAsync(validInput);
			expect(result.success).toBe(true);
			if (result.success) {
				// Body field should be undefined when not provided
				expect(result.data.body).toBeUndefined();
			}
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

			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
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
			// Assuming image/jpeg is a valid mime type based on postAttachmentMimeTypeZodEnum
			const validMimeTypeAttachment = Promise.resolve({
				filename: "test.jpg",
				mimetype: "image/jpeg", // Valid mime type
				encoding: "7bit",
				createReadStream: () => null as unknown as Readable,
			});

			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				attachment: validMimeTypeAttachment,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeDefined();
				expect(result.data.attachment?.mimetype).toBe("image/jpeg");
			}
		});

		it("should leave attachment undefined when promise resolves to falsy value", async () => {
			// Test case where attachment resolves to null
			const nullAttachment = Promise.resolve(null);

			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				attachment: nullAttachment,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeUndefined();
			}
		});

		it("should set attachment to be undefined when explicitly undefined", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				attachment: undefined,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeUndefined();
			}
		});

		it("should set attachment to null when explicitly null", async () => {
			const result = await mutationCreatePostInputSchema.safeParseAsync({
				...validInput,
				attachment: null,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeNull();
			}
		});

		it("should accept missing attachment field", async () => {
			const result =
				await mutationCreatePostInputSchema.safeParseAsync(validInput);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachment).toBeUndefined();
			}
		});
	});
});
