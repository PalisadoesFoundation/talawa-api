import { describe, expect, it } from "vitest";
import { mutationCreateEventInputSchema } from "~/src/graphql/inputs/MutationCreateEventInput";

/**
 * Tests for event attachment FileMetadataInput validation.
 * Now uses pre-upload metadata (objectName, mimeType, fileHash, name)
 * instead of FileUpload streams.
 */

const VALID_FILE_HASH =
	"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

/** Helper to create a valid FileMetadataInput object */
function createFileMetadata(
	mimeType: string,
	name = "test-file",
	objectName = "minio-object-id",
) {
	return {
		fileHash: VALID_FILE_HASH,
		mimeType,
		name,
		objectName,
	};
}

describe("MutationCreateEventInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Event",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
	};

	describe("attachments array limits", () => {
		it("should validate base input structure without attachments", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
			});
			expect(result.success).toBe(true);
		});

		it("should accept events without attachments", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: undefined,
			});
			expect(result.success).toBe(true);
		});

		it("should accept a single valid attachment", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("image/jpeg", "photo.jpg")],
			});
			expect(result.success).toBe(true);
		});

		it("should reject when attachments exceed max(20) limit", () => {
			const tooManyAttachments = Array.from({ length: 21 }, (_, i) =>
				createFileMetadata("image/jpeg", `file-${i}.jpg`, `object-${i}`),
			);

			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: tooManyAttachments,
			});
			expect(result.success).toBe(false);
		});

		it("should accept up to 20 attachments", () => {
			const maxAttachments = Array.from({ length: 20 }, (_, i) =>
				createFileMetadata("image/jpeg", `file-${i}.jpg`, `object-${i}`),
			);

			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: maxAttachments,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("MIME type validation", () => {
		it("should accept valid mimeType image/png", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("image/png", "photo.png")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid mimeType image/jpeg", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("image/jpeg", "photo.jpg")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid mimeType image/webp", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("image/webp", "photo.webp")],
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid mimeType video/mp4", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("video/mp4", "video.mp4")],
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid MIME type application/pdf", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("application/pdf", "doc.pdf")],
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid MIME type text/plain", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [createFileMetadata("text/plain", "file.txt")],
			});
			expect(result.success).toBe(false);
		});

		it("should handle mixed valid and invalid MIME types", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [
					createFileMetadata("image/png", "valid.png", "object-1"),
					createFileMetadata("text/plain", "invalid.txt", "object-2"),
				],
			});
			expect(result.success).toBe(false);
		});

		it("should reject attachment missing required fileHash field", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [
					{
						mimeType: "image/jpeg",
						name: "test.jpg",
						objectName: "test-object",
						// fileHash intentionally missing
					},
				],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const paths = result.error.issues.map((issue) => issue.path.join("."));
				expect(paths.some((p) => p.includes("fileHash"))).toBe(true);
			}
		});

		it("should reject attachment missing required objectName field", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: [
					{
						fileHash: VALID_FILE_HASH,
						mimeType: "image/jpeg",
						name: "test.jpg",
						// objectName intentionally missing
					},
				],
			});
			expect(result.success).toBe(false);
		});
	});
});
