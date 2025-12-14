import { describe, expect, it } from "vitest";
import { videoMimeTypeEnum } from "~/src/drizzle/enums/videoMimeType";

/**
 * Tests for videoMimeTypeEnum - validates allowed video MIME types.
 * This prevents file upload vulnerabilities by whitelisting safe video formats.
 */
describe("videoMimeTypeEnum", () => {
	describe("allowed MIME types", () => {
		it.each([["video/mp4"], ["video/webm"]])("should accept %s", (mimeType) => {
			const result = videoMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(true);
		});
	});

	describe("rejected MIME types", () => {
		it.each([
			["video/avi", "AVI video"],
			["video/quicktime", "QuickTime video"],
			["video/x-msvideo", "MS Video"],
			["video/x-flv", "Flash video"],
			["application/x-shockwave-flash", "Flash files (security risk)"],
			["application/javascript", "JavaScript files"],
			["text/html", "HTML files (XSS risk)"],
		])("should reject %s (%s)", (mimeType) => {
			const result = videoMimeTypeEnum.safeParse(mimeType);
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = videoMimeTypeEnum.safeParse("");
			expect(result.success).toBe(false);
		});
	});
});
