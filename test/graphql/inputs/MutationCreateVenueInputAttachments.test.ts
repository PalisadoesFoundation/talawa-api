import { describe, expect, it } from "vitest";
import { mutationCreateVenueInputSchema } from "~/src/graphql/inputs/MutationCreateVenueInput";

/**
 * Tests for venue attachment file upload validation.
 * Validates array count limits for file uploads (min 1, max 20).
 */
describe("MutationCreateVenueInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Venue",
	};

	// Helper to create valid FileMetadataInput
	const createValidAttachment = (index = 0) => ({
		objectName: `test-object-${index}`,
		mimeType: "image/jpeg",
		fileHash: "a".repeat(64),
		name: `venue-photo-${index}.jpg`,
	});

	describe("attachments array limits", () => {
		it("should accept venues without attachments", () => {
			const result = mutationCreateVenueInputSchema.safeParse({
				...validInput,
				attachments: undefined,
			});
			expect(result.success).toBe(true);
		});

		it("should accept venues where attachments key is omitted", () => {
			const result = mutationCreateVenueInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject empty attachments array when provided", () => {
			// Schema requires .min(1) when attachments is provided
			const result = mutationCreateVenueInputSchema.safeParse({
				...validInput,
				attachments: [],
			});
			expect(result.success).toBe(false);
		});

		it("should accept attachments within the 1-20 limit", () => {
			// Create 10 valid FileMetadataInput attachments (within limit)
			const validAttachments = Array.from({ length: 10 }, (_, i) =>
				createValidAttachment(i),
			);

			const result = mutationCreateVenueInputSchema.safeParse({
				...validInput,
				attachments: validAttachments,
			});
			expect(result.success).toBe(true);
		});

		it("should accept exactly 1 attachment (lower boundary)", () => {
			const oneAttachment = [createValidAttachment(0)];

			const result = mutationCreateVenueInputSchema.safeParse({
				...validInput,
				attachments: oneAttachment,
			});
			expect(result.success).toBe(true);
		});

		it("should accept exactly 20 attachments (upper boundary)", () => {
			const maxAttachments = Array.from({ length: 20 }, (_, i) =>
				createValidAttachment(i),
			);

			const result = mutationCreateVenueInputSchema.safeParse({
				...validInput,
				attachments: maxAttachments,
			});
			expect(result.success).toBe(true);
		});

		it("should reject when attachments exceed max(20) limit", () => {
			// Create 21 attachments to exceed the max(20) limit
			const tooManyAttachments = Array.from({ length: 21 }, (_, i) =>
				createValidAttachment(i),
			);

			const result = mutationCreateVenueInputSchema.safeParse({
				...validInput,
				attachments: tooManyAttachments,
			});
			expect(result.success).toBe(false);
		});
	});
});
