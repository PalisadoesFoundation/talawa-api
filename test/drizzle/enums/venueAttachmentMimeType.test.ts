import { describe, expect, it } from "vitest";
import { venueAttachmentMimeTypeZodEnum } from "~/src/drizzle/enums/venueAttachmentMimeType";

/**
 * Tests for venueAttachmentMimeTypeZodEnum - validates allowed venue attachment MIME types.
 * This prevents file upload vulnerabilities by whitelisting safe image and video formats.
 */
describe("venueAttachmentMimeTypeZodEnum", () => {
	describe("allowed image MIME types", () => {
		it.each([
			["image/avif"],
			["image/jpeg"],
			["image/png"],
			["image/webp"],
		])("should accept %s", (mimeType) => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse(mimeType);
			expect(result.success).toBe(true);
		});
	});

	describe("allowed video MIME types", () => {
		it.each([["video/mp4"], ["video/webm"]])("should accept %s", (mimeType) => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse(mimeType);
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
		])("should reject %s (%s)", (mimeType) => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse(mimeType);
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse("");
			expect(result.success).toBe(false);
		});

		it("should reject null", () => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse(null);
			expect(result.success).toBe(false);
		});

		it("should reject undefined", () => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse(undefined);
			expect(result.success).toBe(false);
		});

		it("should reject MIME types with surrounding whitespace", () => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse(" image/jpeg ");
			expect(result.success).toBe(false);
		});

		it("should reject uppercase MIME types", () => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse("IMAGE/JPEG");
			expect(result.success).toBe(false);
		});

		it("should reject mixed-case MIME types", () => {
			const result = venueAttachmentMimeTypeZodEnum.safeParse("Image/Jpeg");
			expect(result.success).toBe(false);
		});
	});
});
