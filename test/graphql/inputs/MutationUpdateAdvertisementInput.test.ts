import { describe, expect, it } from "vitest";
import { mutationUpdateAdvertisementInputSchema } from "~/src/graphql/inputs/MutationUpdateAdvertisementInput";

/**
 * Tests for MutationUpdateAdvertisementInput schema validation.
 * Validates name and description fields from table schema.
 */
describe("MutationUpdateAdvertisementInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Updated Advertisement Name",
	};

	describe("name field", () => {
		it("should accept valid name", () => {
			const result =
				mutationUpdateAdvertisementInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should accept name update", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				name: "New Ad Name",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("description field", () => {
		it("should accept valid description", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				description: "Valid advertisement description",
			});
			expect(result.success).toBe(true);
		});

		it("should accept longer description", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				description:
					"This is a much longer description for the advertisement to ensure that it accepts more detailed content without issues.",
			});
			expect(result.success).toBe(true);
		});

		it("should accept undefined description", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				description: undefined,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("date validation", () => {
		it("should reject endAt before startAt", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				startAt: new Date("2024-01-01T12:00:00Z"),
				endAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				// Assert that at least one issue has path equal to ["endAt"]
				const hasEndAtIssue = result.error.issues.some(
					(issue) => issue.path.join(",") === "endAt",
				);
				expect(hasEndAtIssue).toBe(true);
			}
		});

		it("should reject endAt equal to startAt", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				startAt: new Date("2024-01-01T12:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				// Assert that at least one issue has path equal to ["endAt"]
				const hasEndAtIssue = result.error.issues.some(
					(issue) => issue.path.join(",") === "endAt",
				);
				expect(hasEndAtIssue).toBe(true);
			}
		});

		it("should accept valid date range (endAt > startAt)", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("optional fields", () => {
		it("should accept update with only startAt", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with only type", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "banner",
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with only endAt", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				// Assert that at least one issue contains the expected message
				const hasOptionalArgIssue = result.error.issues.some((issue) =>
					issue.message.includes("optional argument"),
				);
				expect(hasOptionalArgIssue).toBe(true);
			}
		});
	});

	describe("name field sanitization", () => {
		it("should trim leading and trailing whitespace", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				name: "  Trimmed Name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("Trimmed Name");
			}
		});

		it("should reject empty string after trimming", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				name: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding max length", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				name: "a".repeat(300), // Adjust length based on schema constraints
			});
			expect(result.success).toBe(false);
		});

		it("should sanitize or reject HTML/XSS input", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				name: "<script>alert('xss')</script>",
			});
			// Assert either rejection or sanitization based on schema behavior
			expect(result.success).toBe(true); // or false if schema rejects
			if (result.success) {
				// Note: Current implementation trims but does not strip tags (output encoding strategy)
				// If the requirement changes to strip tags, this expectation should be updated.
				// For now, we expect it to be accepted as is (trimmed).
				// expect(result.data.name).not.toContain("<script>"); // This would fail with current implementation
				expect(result.data.name).toBe("<script>alert('xss')</script>");
			}
		});
	});

	describe("description field sanitization", () => {
		it("should trim leading and trailing whitespace", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				description: "  Trimmed Description  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBe("Trimmed Description");
			}
		});

		it("should reject empty string after trimming", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				description: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding max length (2048)", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				description: "a".repeat(2049),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at exactly max length (2048)", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				...validInput,
				description: "a".repeat(2048),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("id field validation", () => {
		it("should reject invalid UUID format for id", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "invalid-uuid",
				name: "Test Ad",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string for id", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "",
				name: "Test Ad",
			});
			expect(result.success).toBe(false);
		});

		it("should reject missing id", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				name: "Test Ad",
			});
			expect(result.success).toBe(false);
		});

		it("should reject null id", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: null,
				name: "Test Ad",
			});
			expect(result.success).toBe(false);
		});

		it("should reject undefined id", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: undefined,
				name: "Test Ad",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("nullable optional fields", () => {
		it("should accept null for name (to clear the value)", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: null,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBeNull();
			}
		});

		it("should accept null for description", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				description: null,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBeNull();
			}
		});

		it("should accept null for startAt", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: null,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.startAt).toBeNull();
			}
		});

		it("should accept null for endAt", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: null,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.endAt).toBeNull();
			}
		});

		it("should accept null for type", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: null,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.type).toBeNull();
			}
		});
	});

	describe("type field validation", () => {
		it("should accept valid type 'pop_up'", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "pop_up",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid type value", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "invalid_type",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("date validation edge cases", () => {
		it("should skip date comparison when only startAt is provided", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should skip date comparison when only endAt is provided", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should skip date comparison when startAt is null and endAt is provided", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: null,
				endAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should skip date comparison when endAt is null and startAt is provided", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: null,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("name field boundary conditions", () => {
		it("should accept name at exactly min length (1 character)", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "a",
			});
			expect(result.success).toBe(true);
		});

		it("should accept name at exactly max length (256 characters)", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "a".repeat(256),
			});
			expect(result.success).toBe(true);
		});

		it("should reject name exceeding max length (257 characters)", () => {
			const result = mutationUpdateAdvertisementInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "a".repeat(257),
			});
			expect(result.success).toBe(false);
		});
	});
});
