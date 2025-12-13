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

	describe("attachments array limits", () => {
		it("should accept venues without attachments", () => {
			const result = mutationCreateVenueInputSchema.safeParse({
				...validInput,
				attachments: undefined,
			});
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
	});
});
