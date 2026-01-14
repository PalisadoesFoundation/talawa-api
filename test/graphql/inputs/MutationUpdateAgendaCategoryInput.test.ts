import { describe, expect, it } from "vitest";
import {
	MutationUpdateAgendaCategoryInput,
	mutationUpdateAgendaCategoryInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAgendaCategoryInput";

describe("MutationUpdateAgendaCategoryInput Schema", () => {
	const validId = "550e8400-e29b-41d4-a716-446655440000";

	describe("id field validation", () => {
		it("should accept valid UUID id", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				name: "Updated Name",
			});

			expect(result.success).toBe(true);
		});

		it("should reject missing id", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				name: "Updated Name",
			});

			expect(result.success).toBe(false);
		});

		it("should reject invalid UUID id", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: "not-a-uuid",
				name: "Updated Name",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("optional fields validation", () => {
		it("should accept when only name is provided", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				name: "New Category Name",
			});

			expect(result.success).toBe(true);
		});

		it("should accept when only description is provided", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				description: "Updated description",
			});

			expect(result.success).toBe(true);
		});

		it("should accept when both name and description are provided", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				name: "New Name",
				description: "Updated description",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("refine validation (at least one optional argument)", () => {
		it("should reject when neither name nor description is provided", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
			});

			expect(result.success).toBe(false);

			if (!result.success) {
				expect(result.error.issues[0]?.message).toBe(
					"At least one optional argument must be provided.",
				);
			}
		});
	});

	describe("name field max length", () => {
		it("should accept name with length 256", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				name: "a".repeat(256),
			});

			expect(result.success).toBe(true);
		});

		it("should reject name with length 257", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				name: "a".repeat(257),
			});

			expect(result.success).toBe(false);
		});
	});

	describe("description field max length", () => {
		it("should accept description with length 2048", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				description: "a".repeat(2048),
			});

			expect(result.success).toBe(true);
		});

		it("should reject description with length 2049", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				description: "a".repeat(2049),
			});

			expect(result.success).toBe(false);
		});
	});

	describe("name field constraints", () => {
		it("should reject empty name", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				name: "",
			});

			expect(result.success).toBe(false);
		});

		it("should accept valid name", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				name: "Valid Name",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("description field constraints", () => {
		it("should reject empty description", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				description: "",
			});

			expect(result.success).toBe(false);
		});

		it("should accept valid description", () => {
			const result = mutationUpdateAgendaCategoryInputSchema.safeParse({
				id: validId,
				description: "Valid description",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should have MutationUpdateAgendaCategoryInput defined in schema", async () => {
			// Import schema to trigger builder execution
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationUpdateAgendaCategoryInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationUpdateAgendaCategoryInput).toBeDefined();
		});
	});
});
