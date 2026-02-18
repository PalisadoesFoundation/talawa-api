import { describe, expect, it } from "vitest";
import {
	MutationAdminUpdateUserPasswordInput,
	mutationAdminUpdateUserPasswordInputSchema,
} from "~/src/graphql/inputs/MutationAdminUpdateUserPasswordInput";

/**
 * Tests for MutationAdminUpdateUserPasswordInput schema validation.
 * Covers:
 * - required fields
 * - UUID/id validation
 * - min/max password constraints
 * - type validation
 * - GraphQL builder integration
 */
describe("MutationAdminUpdateUserPasswordInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		newPassword: "newPassword123",
		confirmNewPassword: "newPassword123",
	};

	describe("id validation", () => {
		it("should accept valid id", () => {
			const result =
				mutationAdminUpdateUserPasswordInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject invalid id format", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				id: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject missing id", () => {
			const { id: _id, ...input } = validInput;
			const result =
				mutationAdminUpdateUserPasswordInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("newPassword validation", () => {
		it("should accept valid newPassword", () => {
			const result =
				mutationAdminUpdateUserPasswordInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject newPassword shorter than min length", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "short",
			});
			expect(result.success).toBe(false);
		});

		it("should reject newPassword exceeding max length", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "a".repeat(65),
			});
			expect(result.success).toBe(false);
		});

		it("should accept newPassword at min length", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "a".repeat(8),
			});
			expect(result.success).toBe(true);
		});

		it("should accept newPassword at max length", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "a".repeat(64),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("confirmNewPassword validation", () => {
		it("should accept valid confirmNewPassword", () => {
			const result =
				mutationAdminUpdateUserPasswordInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject confirmNewPassword shorter than min length", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "short",
			});
			expect(result.success).toBe(false);
		});

		it("should reject confirmNewPassword exceeding max length", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "a".repeat(65),
			});
			expect(result.success).toBe(false);
		});

		it("should accept confirmNewPassword at boundaries", () => {
			const minResult = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "a".repeat(8),
			});
			expect(minResult.success).toBe(true);

			const maxResult = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "a".repeat(64),
			});
			expect(maxResult.success).toBe(true);
		});
	});

	describe("required fields validation", () => {
		it("should reject missing newPassword", () => {
			const { newPassword: _new, ...input } = validInput;
			const result =
				mutationAdminUpdateUserPasswordInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing confirmNewPassword", () => {
			const { confirmNewPassword: _confirm, ...input } = validInput;
			const result =
				mutationAdminUpdateUserPasswordInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("type validation", () => {
		it("should reject non-string values", () => {
			const result = mutationAdminUpdateUserPasswordInputSchema.safeParse({
				id: 123,
				newPassword: true,
				confirmNewPassword: 12345678,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationAdminUpdateUserPasswordInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationAdminUpdateUserPasswordInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationAdminUpdateUserPasswordInput).toBeDefined();
		});
	});
});
