import { describe, expect, it } from "vitest";
import {
	MutationCreateAgendaCategoryInput,
	mutationCreateAgendaCategoryInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaCategoryInput";

/**
 * Tests for MutationCreateAgendaCategoryInput schema validation.
 * Covers base field validation, optional description rules,
 * UUID checks, and GraphQL builder integration.
 */
describe("MutationCreateAgendaCategoryInput Schema", () => {
	const validBaseInput = {
		eventId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Agenda Category",
	};

	describe("name field validation", () => {
		it("should accept a valid name", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				name: "Valid Category Name",
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty name", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding max length", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				name: "a".repeat(257),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at max length", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				name: "a".repeat(256),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("description field validation", () => {
		it("should accept valid description", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				description: "This is a valid description",
			});
			expect(result.success).toBe(true);
		});

		it("should accept missing description (optional field)", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty description", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding max length", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				description: "a".repeat(2049),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at max length", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				description: "a".repeat(2048),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("eventId field validation", () => {
		it("should accept valid UUID eventId", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				eventId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID eventId", () => {
			const result = mutationCreateAgendaCategoryInputSchema.safeParse({
				...validBaseInput,
				eventId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("required fields validation", () => {
		it("should reject missing eventId", () => {
			const { eventId, ...input } = validBaseInput;
			const result = mutationCreateAgendaCategoryInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing name", () => {
			const { name, ...input } = validBaseInput;
			const result = mutationCreateAgendaCategoryInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationCreateAgendaCategoryInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationCreateAgendaCategoryInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationCreateAgendaCategoryInput).toBeDefined();
		});
	});
});
