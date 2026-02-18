import { describe, expect, it } from "vitest";
import { FILE_UPLOAD_CONFIG } from "~/src/routes/graphql";

/**
 * Tests for GraphQL file upload configuration security.
 * Documents the security limits enforced by mercurius-upload.
 * Uses the canonical config imported from src/routes/graphql.ts.
 */
describe("GraphQL File Upload Security Configuration", () => {
	describe("file size limits", () => {
		it("should enforce 10MB maximum file size", () => {
			expect(FILE_UPLOAD_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
		});

		it("should enforce 1MB maximum field size for non-file data", () => {
			expect(FILE_UPLOAD_CONFIG.maxFieldSize).toBe(1 * 1024 * 1024);
		});

		it("should limit to 20 files per GraphQL operation", () => {
			expect(FILE_UPLOAD_CONFIG.maxFiles).toBe(20);
		});
	});

	describe("security policy guardrails", () => {
		it("should have maxFiles within acceptable security limits", () => {
			// Policy: No more than 20 files per operation to prevent resource exhaustion
			expect(FILE_UPLOAD_CONFIG.maxFiles).toBeLessThanOrEqual(20);
		});

		it("should have maxFileSize within acceptable security limits", () => {
			// Policy: No file larger than 10MB to prevent storage abuse
			expect(FILE_UPLOAD_CONFIG.maxFileSize).toBeLessThanOrEqual(
				10 * 1024 * 1024,
			);
		});

		it("should have maxFieldSize within acceptable security limits", () => {
			// Policy: No field larger than 1MB to prevent request body abuse
			expect(FILE_UPLOAD_CONFIG.maxFieldSize).toBeLessThanOrEqual(
				1 * 1024 * 1024,
			);
		});
	});
});
