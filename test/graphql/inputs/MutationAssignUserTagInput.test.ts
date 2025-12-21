import { describe, expect, it } from "vitest";
import { mutationAssignUserTagInputSchema } from "~/src/graphql/inputs/MutationAssignUserTagInput";

/**
 * Tests for MutationAssignUserTagInput schema validation.
 * Validates that both assigneeId and tagId are required for assigning a tag to a user.
 */
describe("MutationAssignUserTagInput Schema", () => {
	const validUuid1 = "550e8400-e29b-41d4-a716-446655440000";
	const validUuid2 = "660e8400-e29b-41d4-a716-446655440001";

	describe("valid input", () => {
		it("should accept valid input with both assigneeId and tagId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
				tagId: validUuid2,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.assigneeId).toBe(validUuid1);
				expect(result.data.tagId).toBe(validUuid2);
			}
		});

		it("should accept valid input with same UUID for both fields", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
				tagId: validUuid1,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("assigneeId field validation", () => {
		it("should reject input without assigneeId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				tagId: validUuid2,
			});
			expect(result.success).toBe(false);
		});

		it("should reject input with undefined assigneeId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: undefined,
				tagId: validUuid2,
			});
			expect(result.success).toBe(false);
		});

		it("should reject input with null assigneeId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: null,
				tagId: validUuid2,
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid UUID format for assigneeId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: "invalid-uuid",
				tagId: validUuid2,
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string for assigneeId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: "",
				tagId: validUuid2,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("tagId field validation", () => {
		it("should reject input without tagId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
			});
			expect(result.success).toBe(false);
		});

		it("should reject input with undefined tagId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
				tagId: undefined,
			});
			expect(result.success).toBe(false);
		});

		it("should reject input with null tagId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
				tagId: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid UUID format for tagId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
				tagId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string for tagId", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
				tagId: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("refine validation - both fields required", () => {
		it("should reject empty input", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("should reject input with both fields undefined", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: undefined,
				tagId: undefined,
			});
			expect(result.success).toBe(false);
		});

		it("should reject input with both fields null", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: null,
				tagId: null,
			});
			expect(result.success).toBe(false);
		});

		it("should have correct error message when validation fails", () => {
			const result = mutationAssignUserTagInputSchema.safeParse({
				assigneeId: validUuid1,
				tagId: undefined,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				// Should have an error about tagId being required or undefined
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasTagIdIssue = result.error.issues.some(
					(issue) =>
						issue.path.includes("tagId") ||
						issue.message.includes("tagId") ||
						issue.message.includes("Both"),
				);
				expect(hasTagIdIssue).toBe(true);
			}
		});
	});
});
