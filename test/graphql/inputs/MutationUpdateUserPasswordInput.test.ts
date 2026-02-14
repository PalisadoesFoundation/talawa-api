import { describe, expect, it } from "vitest";
import {
	MutationUpdateUserPasswordInput,
	mutationUpdateUserPasswordInputSchema,
} from "~/src/graphql/inputs/MutationUpdateUserPasswordInput";

/**
 * Tests for MutationUpdateUserPasswordInput schema validation.
 * Covers:
 * - required fields
 * - min/max constraints
 * - edge lengths
 * - invalid types
 * - GraphQL builder integration
 */
describe("MutationUpdateUserPasswordInput Schema", () => {
	const validInput = {
		oldPassword: "oldPassword123",
		newPassword: "newPassword123",
		confirmNewPassword: "newPassword123",
	};

	describe("oldPassword validation", () => {
		it("should accept valid oldPassword", () => {
			const result =
				mutationUpdateUserPasswordInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject empty oldPassword", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				oldPassword: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject oldPassword exceeding max length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				oldPassword: "a".repeat(65),
			});
			expect(result.success).toBe(false);
		});

		it("should accept oldPassword at max length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				oldPassword: "a".repeat(64),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("newPassword validation", () => {
		it("should accept valid newPassword", () => {
			const result =
				mutationUpdateUserPasswordInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject newPassword shorter than min length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "short",
			});
			expect(result.success).toBe(false);
		});

		it("should reject newPassword exceeding max length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "a".repeat(65),
			});
			expect(result.success).toBe(false);
		});

		it("should accept newPassword at min length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "a".repeat(8),
			});
			expect(result.success).toBe(true);
		});

		it("should accept newPassword at max length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				newPassword: "a".repeat(64),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("confirmNewPassword validation", () => {
		it("should accept valid confirmNewPassword", () => {
			const result =
				mutationUpdateUserPasswordInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject confirmNewPassword shorter than min length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "short",
			});
			expect(result.success).toBe(false);
		});

		it("should reject confirmNewPassword exceeding max length", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "a".repeat(65),
			});
			expect(result.success).toBe(false);
		});

		it("should accept confirmNewPassword at boundaries", () => {
			const minResult = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "a".repeat(8),
			});
			expect(minResult.success).toBe(true);

			const maxResult = mutationUpdateUserPasswordInputSchema.safeParse({
				...validInput,
				confirmNewPassword: "a".repeat(64),
			});
			expect(maxResult.success).toBe(true);
		});
	});

	describe("required fields validation", () => {
		it("should reject missing oldPassword", () => {
			const { oldPassword: _old, ...input } = validInput;
			const result = mutationUpdateUserPasswordInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing newPassword", () => {
			const { newPassword: _new, ...input } = validInput;
			const result = mutationUpdateUserPasswordInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing confirmNewPassword", () => {
			const { confirmNewPassword: _confirm, ...input } = validInput;
			const result = mutationUpdateUserPasswordInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("type validation", () => {
		it("should reject non-string values", () => {
			const result = mutationUpdateUserPasswordInputSchema.safeParse({
				oldPassword: 123,
				newPassword: 12345678,
				confirmNewPassword: true,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationUpdateUserPasswordInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationUpdateUserPasswordInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationUpdateUserPasswordInput).toBeDefined();
		});
	});
});
