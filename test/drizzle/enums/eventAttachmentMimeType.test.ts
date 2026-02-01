import { describe, expect, it } from "vitest";
import { eventAttachmentMimeTypeZodEnum } from "~/src/drizzle/enums/eventAttachmentMimeType";

/**
 * Tests for eventAttachmentMimeTypeEnum - validates allowed event attachment MIME types.
 * This prevents file upload vulnerabilities by whitelisting safe image and video formats.
 */
describe("eventAttachmentMimeTypeEnum", () => {
	describe("allowed image MIME types", () => {
		it.each([
			["image/avif"],
			["image/jpeg"],
			["image/png"],
			["image/webp"],
		])("should accept %s", (mimeType) => {
			const result = eventAttachmentMimeTypeZodEnum.safeParse(mimeType);
			expect(result.success).toBe(true);
		});
	});

	describe("allowed video MIME types", () => {
		it.each([["video/mp4"], ["video/webm"]])("should accept %s", (mimeType) => {
			const result = eventAttachmentMimeTypeZodEnum.safeParse(mimeType);
			expect(result.success).toBe(true);
		});
	});

	describe("rejected MIME types", () => {
		it.each([
			["image/svg+xml", "SVG (potential XSS)"],
			["application/pdf", "PDF files"],
			["application/javascript", "JavaScript files"],
			["text/html", "HTML files (XSS risk)"],
			["application/x-executable", "executable files"],
			["application/zip", "ZIP archives"],
			["application/x-php", "PHP files"],
		])("should reject %s (%s)", (mimeType) => {
			const result = eventAttachmentMimeTypeZodEnum.safeParse(mimeType);
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = eventAttachmentMimeTypeZodEnum.safeParse("");
			expect(result.success).toBe(false);
		});
	});
});
