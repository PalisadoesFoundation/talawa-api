import { describe, expect, it } from "vitest";
import { mutationCreateEventInputSchema } from "~/src/graphql/inputs/MutationCreateEventInput";

/**
 * Tests for event attachment file upload validation.
 * Validates array count limits for file uploads.
 */
describe("MutationCreateEventInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Event",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
	};

	describe("attachments array limits", () => {
		it("should validate base input structure without attachments", () => {
			// Note: Schema allows .max(20) attachments
			// Just testing schema structure accepts base input, actual FileUpload validation happens at mutation level
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

			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: tooManyAttachments,
			});
			expect(result.success).toBe(false);
		});
	});
});
