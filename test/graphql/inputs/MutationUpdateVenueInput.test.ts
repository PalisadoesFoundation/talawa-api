import { describe, expect, it } from "vitest";
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

		it("should reject name exceeding 256 characters", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				name: "a".repeat(257),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at exactly 256 characters", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				name: "a".repeat(256),
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

		it("should reject description exceeding 2048 characters", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "a".repeat(2049),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at exactly 2048 characters", () => {
			const result = mutationUpdateVenueInputSchema.safeParse({
				...validInput,
				description: "a".repeat(2048),
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
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("optional argument");
			}
		});
	});
});
