import { describe, expect, it } from "vitest";
import {
	VENUE_DESCRIPTION_MAX_LENGTH,
	VENUE_NAME_MAX_LENGTH,
} from "~/src/drizzle/tables/venues";
import { mutationUpdateVenueInputSchema } from "~/src/graphql/inputs/MutationUpdateVenueInput";

/**
 * Tests for MutationUpdateVenueInput schema validation.
 * Validates name (max 256) and description (max 2048) field trimming and length constraints.
 */
describe("MutationUpdateVenueInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Updated Venue Name",
	};

	describe("name field", () => {
		it("should accept valid name", () => {
			const result = mutationUpdateVenueInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from name", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				name: "  trimmed name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("trimmed name");
			}
		});

		it("should reject whitespace-only name", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				name: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string name", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding length limit", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				name: "a".repeat(VENUE_NAME_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at exactly max length", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				name: "a".repeat(VENUE_NAME_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("description field", () => {
		it("should accept valid description", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "Valid venue description",
			});
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from description", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "  trimmed description  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBe("trimmed description");
			}
		});

		it("should reject whitespace-only description", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string description", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding length limit", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "a".repeat(VENUE_DESCRIPTION_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at exactly max length", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "a".repeat(VENUE_DESCRIPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("capacity field", () => {
		it("should accept capacity: 0 (falsy but provided)", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				capacity: 0,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.capacity).toBe(0);
			}
		});

		it("should accept positive capacity", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				capacity: 100,
			});
			expect(result.success).toBe(true);
		});

		it("should reject negative capacity", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				capacity: -1,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("attachments field", () => {
		it("should reject empty attachments array", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				attachments: [],
			});
			expect(result.success).toBe(false);
		});

		it("should reject attachments array exceeding max length (20)", () => {
			const tooManyAttachments = Array.from({ length: 21 }, () =>
				Promise.resolve({
					filename: "test.jpg",
					mimetype: "image/jpeg",
					encoding: "7bit",
					createReadStream: () => null,
				}),
			);
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				attachments: tooManyAttachments,
			});
			expect(result.success).toBe(false);
		});

		it("should accept valid attachments array (single item)", () => {
			const validAttachments = [
				Promise.resolve({
					filename: "test.jpg",
					mimetype: "image/jpeg",
					encoding: "7bit",
					createReadStream: () => null,
				}),
			];
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				attachments: validAttachments,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((i) =>
						i.message.includes("optional argument"),
					),
				).toBe(true);
			}
		});
	});
});
