import { describe, expect, it } from "vitest";
import { mutationCreateAdvertisementInputSchema } from "~/src/graphql/inputs/MutationCreateAdvertisementInput";

/**
 * Tests for advertisement attachment file upload validation.
 * Validates array count limits for file uploads (min 1, max 20).
 */
describe("MutationCreateAdvertisementInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Advertisement",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
		type: "banner" as const,
	};

	describe("attachments array limits", () => {
		it("should reject when attachments is empty array", () => {
			// Schema requires attachments with .min(1) when provided
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [],
			});
			expect(result.success).toBe(false);
		});

		it("should accept advertisement without attachments", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
			});
			// Confirms validation passes when attachments are omitted
			expect(result.success).toBe(true);
		});

		it("should reject when attachments exceed max(20) limit", () => {
			// Create 21 mock attachment promises to exceed the max(20) limit
			const tooManyAttachments = Array.from({ length: 21 }, () =>
				Promise.resolve({
					filename: "test.jpg",
					mimetype: "image/jpeg",
					encoding: "7bit",
					createReadStream: () => null,
				}),
			);

			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: tooManyAttachments,
			});
			expect(result.success).toBe(false);
		});
	});
});
