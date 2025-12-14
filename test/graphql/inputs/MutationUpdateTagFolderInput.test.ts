import { describe, expect, it } from "vitest";
import { mutationUpdateTagFolderInputSchema } from "~/src/graphql/inputs/MutationUpdateTagFolderInput";

/**
 * Tests for MutationUpdateTagFolderInput schema validation.
 * Validates name field trimming and length constraints (min 1, max 256).
 */
describe("MutationUpdateTagFolderInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Updated Tag Folder",
	};

	describe("name field", () => {
		it("should accept valid name", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from name", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				...validInput,
				name: "  trimmed name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("trimmed name");
			}
		});

		it("should reject whitespace-only name", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				...validInput,
				name: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string name", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				...validInput,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding 256 characters", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				...validInput,
				name: "a".repeat(257),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at exactly 256 characters", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				...validInput,
				name: "a".repeat(256),
			});
			expect(result.success).toBe(true);
		});

		it("should accept minimum length name (1 character)", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				...validInput,
				name: "a",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
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

		it("should accept input with only name", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Updated Name",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("Updated Name");
			}
		});

		it("should accept input with only parentFolderId", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				parentFolderId: "660e8400-e29b-41d4-a716-446655440001",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.parentFolderId).toBe(
					"660e8400-e29b-41d4-a716-446655440001",
				);
			}
		});

		it("should accept input with both name and parentFolderId", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Updated Name",
				parentFolderId: "660e8400-e29b-41d4-a716-446655440001",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("Updated Name");
				expect(result.data.parentFolderId).toBe(
					"660e8400-e29b-41d4-a716-446655440001",
				);
			}
		});

		it("should accept input with parentFolderId and explicit undefined name", () => {
			const result = mutationUpdateTagFolderInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: undefined,
				parentFolderId: "660e8400-e29b-41d4-a716-446655440001",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.parentFolderId).toBe(
					"660e8400-e29b-41d4-a716-446655440001",
				);
			}
		});
	});
});
