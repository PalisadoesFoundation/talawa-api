import { describe, expect, it } from "vitest";
import { mutationCreateAdvertisementInputSchema } from "~/src/graphql/inputs/MutationCreateAdvertisementInput";

/**
 * Tests for advertisement attachment file metadata validation.
 * Tests both array limits and MIME type validation.
 */
describe("MutationCreateAdvertisementInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Advertisement",
		description: "Test description",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
		type: "banner" as const,
	};

	// Helper to create FileMetadataInput objects
	function createFileMetadata(name: string, mimeType: string) {
		return {
			objectName: `test-objects/${name}`,
			mimeType: mimeType,
			fileHash: "a".repeat(64), // Valid 64-char hex hash
			name: name,
		};
	}

	describe("attachments array limits", () => {
		it("should accept advertisement without attachments field", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachments).toBeUndefined();
			}
		});

		it("should accept exactly 1 attachment (lower boundary)", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.jpg", "image/jpeg")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept exactly 20 attachments (upper boundary)", () => {
			const attachments = Array.from({ length: 20 }, (_, i) =>
				createFileMetadata(`test${i}.jpg`, "image/jpeg"),
			);
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments,
			});
			expect(result.success).toBe(true);
		});

		it("should reject when attachments exceed max (21 attachments)", () => {
			const attachments = Array.from({ length: 21 }, (_, i) =>
				createFileMetadata(`test${i}.jpg`, "image/jpeg"),
			);
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments,
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues.length > 0) {
				expect(result.error.issues[0]?.code).toBe("too_big");
			}
		});
	});

	describe("MIME type validation", () => {
		it("should accept valid image/png", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.png", "image/png")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid image/jpeg", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.jpg", "image/jpeg")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid image/webp", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.webp", "image/webp")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid video/quicktime", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.mov", "video/quicktime")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid video/mp4", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.mp4", "video/mp4")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid video/webm", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.webm", "video/webm")],
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid MIME type text/plain", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.txt", "text/plain")],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const mimeTypeIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("mimeType") && issue.code === "invalid_value",
				);
				expect(mimeTypeIssue).toBeDefined();
			}
		});

		it("should reject invalid MIME type application/pdf", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("test.pdf", "application/pdf")],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const mimeTypeIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("mimeType") && issue.code === "invalid_value",
				);
				expect(mimeTypeIssue).toBeDefined();
			}
		});

		it("should handle mixed valid and invalid MIME types", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [
					createFileMetadata("valid.png", "image/png"),
					createFileMetadata("invalid.txt", "text/plain"),
					createFileMetadata("valid2.mp4", "video/mp4"),
				],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const mimeTypeIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("mimeType") && issue.code === "invalid_value",
				);
				expect(mimeTypeIssue).toBeDefined();
			}
		});

		it("should reject multiple invalid MIME types with correct paths", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [
					createFileMetadata("invalid1.txt", "text/plain"),
					createFileMetadata("valid.png", "image/png"),
					createFileMetadata("invalid2.pdf", "application/pdf"),
				],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const mimeTypeIssues = result.error.issues.filter(
					(issue) =>
						issue.path.includes("mimeType") && issue.code === "invalid_value",
				);
				expect(mimeTypeIssues.length).toBeGreaterThanOrEqual(2);
			}
		});
	});

	describe("FileMetadataInput field validation", () => {
		it("should reject missing objectName", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [
					{
						mimeType: "image/png",
						fileHash: "a".repeat(64),
						name: "test.png",
						// objectName missing
					},
				],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							path: ["attachments", 0, "objectName"],
						}),
					]),
				);
			}
		});

		it("should reject invalid fileHash (not 64 hex chars)", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [
					{
						objectName: "test-object",
						mimeType: "image/png",
						fileHash: "invalid",
						name: "test.png",
					},
				],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							path: ["attachments", 0, "fileHash"],
						}),
					]),
				);
			}
		});
	});
});
