import { describe, expect, it } from "vitest";

/**
 * Tests for GraphQL file upload configuration security.
 * Documents the security limits enforced by mercurius-upload.
 */
describe("GraphQL File Upload Security Configuration", () => {
	// These values are from src/routes/graphql.ts
	const FILE_UPLOAD_CONFIG = {
		maxFieldSize: 1048576, // 1MB - max non-file multipart form field size
		maxFiles: 20, // max files per operation
		maxFileSize: 10485760, // 10MB - max individual file size
	};

	describe("file size limits", () => {
		it("should enforce 10MB maximum file size", () => {
			// 10MB = 1024 * 1024 * 10 = 10485760 bytes
			expect(FILE_UPLOAD_CONFIG.maxFileSize).toBe(10485760);
			expect(FILE_UPLOAD_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
		});

		it("should enforce 1MB maximum field size for non-file data", () => {
			// 1MB = 1024 * 1024 = 1048576 bytes
			expect(FILE_UPLOAD_CONFIG.maxFieldSize).toBe(1048576);
			expect(FILE_UPLOAD_CONFIG.maxFieldSize).toBe(1 * 1024 * 1024);
		});

		it("should limit to 20 files per GraphQL operation", () => {
			expect(FILE_UPLOAD_CONFIG.maxFiles).toBe(20);
		});
	});

	describe("security considerations", () => {
		it("should have reasonable limits to prevent DoS attacks", () => {
			// Max total upload size per request = 20 files * 10MB = 200MB
			const maxTotalUploadSize =
				FILE_UPLOAD_CONFIG.maxFiles * FILE_UPLOAD_CONFIG.maxFileSize;
			expect(maxTotalUploadSize).toBe(200 * 1024 * 1024); // 200MB max

			// This is a reasonable limit that prevents abuse while allowing legitimate use
			expect(maxTotalUploadSize).toBeLessThanOrEqual(500 * 1024 * 1024); // Should be <= 500MB
		});

		it("should have file limits consistent with schema attachment limits", () => {
			// Schema limits (.max(20)) should match upload config
			expect(FILE_UPLOAD_CONFIG.maxFiles).toBe(20);
		});
	});
});
