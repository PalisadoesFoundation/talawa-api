import { describe, expect, it } from "vitest";
import { advertisementAttachmentMimeTypeEnum } from "~/src/drizzle/enums/advertisementAttachmentMimeType";

/**
 * Tests for advertisementAttachmentMimeTypeEnum - validates allowed advertisement attachment MIME types.
 * This prevents file upload vulnerabilities by whitelisting safe image and video formats.
 */
describe("advertisementAttachmentMimeTypeEnum", () => {
	describe("allowed image MIME types", () => {
		it.each([
			["image/avif"],
			["image/jpeg"],
			["image/png"],
			["image/webp"],
		])("should accept %s", (mimeType) => {
			const result = advertisementAttachmentMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(true);
		});
	});

	describe("allowed video MIME types", () => {
		it.each([["video/mp4"], ["video/webm"]])("should accept %s", (mimeType) => {
			const result = advertisementAttachmentMimeTypeEnum.safeParse(mimeType);
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
			const result = advertisementAttachmentMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = advertisementAttachmentMimeTypeEnum.safeParse("");
			expect(result.success).toBe(false);
		});

		it("should reject whitespace-only string", () => {
			const result = advertisementAttachmentMimeTypeEnum.safeParse("   ");
			expect(result.success).toBe(false);
		});

		it("should reject null", () => {
			const result = advertisementAttachmentMimeTypeEnum.safeParse(null);
			expect(result.success).toBe(false);
		});

		it("should reject undefined", () => {
			const result = advertisementAttachmentMimeTypeEnum.safeParse(undefined);
			expect(result.success).toBe(false);
		});

		it("should reject mixed-case MIME types", () => {
			const result =
				advertisementAttachmentMimeTypeEnum.safeParse("Image/JPEG");
			expect(result.success).toBe(false);
		});

		it("should reject MIME types with leading/trailing whitespace", () => {
			const result =
				advertisementAttachmentMimeTypeEnum.safeParse(" image/jpeg ");
			expect(result.success).toBe(false);
		});
	});
});
