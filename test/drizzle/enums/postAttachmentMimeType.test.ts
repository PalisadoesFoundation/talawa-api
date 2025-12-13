import { describe, expect, it } from "vitest";
import { postAttachmentMimeTypeEnum } from "~/src/drizzle/enums/postAttachmentMimeType";

/**
 * Tests for postAttachmentMimeTypeEnum - validates allowed post attachment MIME types.
 * This prevents file upload vulnerabilities by whitelisting safe image and video formats.
 */
describe("postAttachmentMimeTypeEnum", () => {
	describe("allowed image MIME types", () => {
		it.each([["image/avif"], ["image/jpeg"], ["image/png"], ["image/webp"]])(
			"should accept %s",
			(mimeType) => {
				const result = postAttachmentMimeTypeEnum.safeParse(mimeType);
				expect(result.success).toBe(true);
			},
		);
	});

	describe("allowed video MIME types", () => {
		it.each([["video/mp4"], ["video/webm"]])("should accept %s", (mimeType) => {
			const result = postAttachmentMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(true);
		});
	});

	describe("rejected MIME types", () => {
		it.each([
			["image/svg+xml", "SVG (potential XSS)"],
			["image/gif", "GIF images"],
			["application/pdf", "PDF files"],
			["application/javascript", "JavaScript files"],
			["text/html", "HTML files (XSS risk)"],
			["application/x-executable", "executable files"],
			["application/octet-stream", "arbitrary binary"],
		])("should reject %s (%s)", (mimeType) => {
			const result = postAttachmentMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = postAttachmentMimeTypeEnum.safeParse("");
			expect(result.success).toBe(false);
		});

		it("should reject null", () => {
			const result = postAttachmentMimeTypeEnum.safeParse(null);
			expect(result.success).toBe(false);
		});

		it("should reject undefined", () => {
			const result = postAttachmentMimeTypeEnum.safeParse(undefined);
			expect(result.success).toBe(false);
		});

		it("should reject whitespace-only string", () => {
			const result = postAttachmentMimeTypeEnum.safeParse("   ");
			expect(result.success).toBe(false);
		});

		it("should reject valid MIME type with leading/trailing whitespace", () => {
			const result = postAttachmentMimeTypeEnum.safeParse(" image/png ");
			expect(result.success).toBe(false);
		});
	});

	describe("case sensitivity", () => {
		it("should accept valid MIME type with mixed casing", () => {
			const result = postAttachmentMimeTypeEnum.safeParse("ImAgE/PNg");
			expect(result.success).toBe(true);
		});

		it("should accept uppercase MIME type", () => {
			const result = postAttachmentMimeTypeEnum.safeParse("IMAGE/JPEG");
			expect(result.success).toBe(true);
		});
	});
});
