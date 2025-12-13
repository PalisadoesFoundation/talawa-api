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
});
