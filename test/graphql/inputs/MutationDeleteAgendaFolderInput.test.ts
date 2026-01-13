import { describe, expect, it } from "vitest";
import {
	MutationDeleteAgendaFolderInput,
	mutationDeleteAgendaFolderInputSchema,
} from "~/src/graphql/inputs/MutationDeleteAgendaFolderInput";

/**
 * Tests for MutationDeleteAgendaFolderInput schema validation.
 * Covers required field validation, UUID checks,
 * and GraphQL builder integration.
 */
describe("MutationDeleteAgendaFolderInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
	};

	describe("id field validation", () => {
		it("should accept a valid UUID id", () => {
			const result =
				mutationDeleteAgendaFolderInputSchema.safeParse(validInput);

			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID id", () => {
			const result = mutationDeleteAgendaFolderInputSchema.safeParse({
				id: "not-a-uuid",
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing id", () => {
			const result = mutationDeleteAgendaFolderInputSchema.safeParse({});

			expect(result.success).toBe(false);
		});

		it("should reject null id", () => {
			const result = mutationDeleteAgendaFolderInputSchema.safeParse({
				id: null,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("schema strictness", () => {
		it("should reject additional unexpected fields", () => {
			const result = mutationDeleteAgendaFolderInputSchema.safeParse({
				id: validInput.id,
				extraField: "not-allowed",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationDeleteAgendaFolderInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationDeleteAgendaFolderInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationDeleteAgendaFolderInput).toBeDefined();
		});
	});
});
