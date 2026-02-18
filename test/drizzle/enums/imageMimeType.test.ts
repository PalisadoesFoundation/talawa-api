import { describe, expect, it } from "vitest";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";

/**
 * Tests for imageMimeTypeEnum - validates allowed image MIME types.
 * This prevents file upload vulnerabilities by whitelisting safe image formats.
 */
describe("imageMimeTypeEnum", () => {
	describe("allowed MIME types", () => {
		it.each([
			["image/avif"],
			["image/jpeg"],
			["image/png"],
			["image/webp"],
		])("should accept %s", (mimeType) => {
			const result = imageMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(true);
		});
	});

	describe("rejected MIME types", () => {
		it.each([
			["image/gif", "GIF images"],
			["image/svg+xml", "SVG (potential XSS)"],
			["image/bmp", "BMP images"],
			["image/tiff", "TIFF images"],
			["application/pdf", "PDF files"],
			["application/javascript", "JavaScript files"],
			["text/html", "HTML files (XSS risk)"],
			["application/x-executable", "executable files"],
			["application/octet-stream", "arbitrary binary"],
		])("should reject %s (%s)", (mimeType) => {
			const result = imageMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = imageMimeTypeEnum.safeParse("");
			expect(result.success).toBe(false);
		});

		it("should reject null", () => {
			const result = imageMimeTypeEnum.safeParse(null);
			expect(result.success).toBe(false);
		});

		it("should reject undefined", () => {
			const result = imageMimeTypeEnum.safeParse(undefined);
			expect(result.success).toBe(false);
		});
	});
});
