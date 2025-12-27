import { describe, expect, it } from "vitest";
import { mutationUpdateFundCampaignInputSchema } from "~/src/graphql/inputs/MutationUpdateFundCampaignInput";

/**
 * Tests for MutationUpdateFundCampaignInput schema validation.
 * Validates individual field constraints, date range validation, and "at least one optional" requirement.
 */
describe("MutationUpdateFundCampaignInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Updated Campaign Name",
	};

	describe("id field", () => {
		it("should accept valid UUID", () => {
			const result =
				mutationUpdateFundCampaignInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID format", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				...validInput,
				id: "invalid-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject missing id", () => {
			const { id, ...inputWithoutId } = validInput;
			const result =
				mutationUpdateFundCampaignInputSchema.safeParse(inputWithoutId);
			expect(result.success).toBe(false);
		});

		it("should reject empty string as id", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				...validInput,
				id: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("name field", () => {
		it("should accept valid name", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Valid Campaign Name",
			});
			expect(result.success).toBe(true);
		});

		it("should NOT trim whitespace from name (schema does not apply trimming)", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "  trimmed name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				// Schema does not trim, so whitespace is preserved
				expect(result.data.name).toBe("  trimmed name  ");
			}
		});

		it("should accept whitespace-only name (schema allows it since no trim is applied)", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "   ",
			});
			// Schema has .min(1) but no .trim(), so whitespace-only strings pass length check
			expect(result.success).toBe(true);
		});

		it("should reject empty string name", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should accept name with 1 character", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "A",
			});
			expect(result.success).toBe(true);
		});

		it("should accept name with 256 characters", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "a".repeat(256),
			});
			expect(result.success).toBe(true);
		});

		it("should reject name exceeding 256 characters", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "a".repeat(257),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name with unicode characters", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Campaign 日本語 🎉",
			});
			expect(result.success).toBe(true);
		});

		it("should accept name with special characters", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Campaign #1 - 2024!",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("goalAmount field", () => {
		it("should accept valid positive integer", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: 1000,
			});
			expect(result.success).toBe(true);
		});

		it("should accept zero as goal amount", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: 0,
			});
			expect(result.success).toBe(true);
		});

		it("should accept negative integers (schema has no minimum constraint)", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: -100,
			});
			// Database schema defines goalAmount as integer without minimum constraint
			expect(result.success).toBe(true);
		});

		it("should reject non-integer values", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: 100.5,
			});
			expect(result.success).toBe(false);
		});

		it("should reject string values", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: "1000",
			});
			expect(result.success).toBe(false);
		});

		it("should accept large integer values", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: 2147483647, // max 32-bit integer
			});
			expect(result.success).toBe(true);
		});
	});

	describe("date validation", () => {
		it("should reject endAt before startAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T12:00:00Z"),
				endAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const endAtIssue = result.error.issues.find(
					(issue) => issue.path.join(",") === "endAt",
				);
				expect(endAtIssue).toBeDefined();
				expect(endAtIssue?.message).toContain(
					"Must be greater than the value:",
				);
			}
		});

		it("should reject endAt equal to startAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T12:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const endAtIssue = result.error.issues.find(
					(issue) => issue.path.join(",") === "endAt",
				);
				expect(endAtIssue).toBeDefined();
			}
		});

		it("should accept valid date range (endAt > startAt)", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should accept when only startAt is provided", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should accept when only endAt is provided", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should accept when neither startAt nor endAt is provided", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Updated Name",
			});
			expect(result.success).toBe(true);
		});

		it("should validate dates very close together (1 millisecond apart)", () => {
			const startAt = new Date("2024-01-01T10:00:00.000Z");
			const endAt = new Date("2024-01-01T10:00:00.001Z");
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt,
				endAt,
			});
			expect(result.success).toBe(true);
		});

		it("should validate same date with different times", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T08:00:00Z"),
				endAt: new Date("2024-01-01T18:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should validate dates far apart (years)", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: new Date("2026-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should include ISO string in error message for date validation", () => {
			const startAt = new Date("2024-01-01T12:00:00Z");
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt,
				endAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const endAtIssue = result.error.issues.find(
					(issue) => issue.path.join(",") === "endAt",
				);
				expect(endAtIssue?.message).toContain(startAt.toISOString());
			}
		});

		it("should handle leap year dates", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-02-29T10:00:00Z"),
				endAt: new Date("2024-03-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should handle year boundary dates", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-12-31T23:00:00Z"),
				endAt: new Date("2025-01-01T01:00:00Z"),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation - at least one optional argument", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const hasOptionalArgIssue = result.error.issues.some((issue) =>
					issue.message.includes("optional argument"),
				);
				expect(hasOptionalArgIssue).toBe(true);
			}
		});

		it("should accept update with only name", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "New Name",
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with only goalAmount", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: 5000,
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with only startAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with only endAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with multiple optional fields", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "New Name",
				goalAmount: 10000,
			});
			expect(result.success).toBe(true);
		});

		it("should accept update with all optional fields", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "New Name",
				goalAmount: 10000,
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("edge cases and type coercion", () => {
		it("should reject null as name", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject null as goalAmount", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				goalAmount: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject null as startAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject null as endAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject date string instead of Date object for startAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: "2024-01-01T10:00:00Z",
			});
			expect(result.success).toBe(false);
		});

		it("should reject date string instead of Date object for endAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: "2024-01-01T12:00:00Z",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid date object for startAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				startAt: new Date("invalid"),
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid date object for endAt", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				endAt: new Date("invalid"),
			});
			expect(result.success).toBe(false);
		});

		it("should accept update with all valid data types", () => {
			const result = mutationUpdateFundCampaignInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Valid Name",
				goalAmount: 5000,
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440000");
				expect(result.data.name).toBe("Valid Name");
				expect(result.data.goalAmount).toBe(5000);
				expect(result.data.startAt).toBeInstanceOf(Date);
				expect(result.data.endAt).toBeInstanceOf(Date);
			}
		});
	});
});
