import { describe, expect, it } from "vitest";
import {
	MutationUpdateAgendaItemSequenceInput,
	MutationUpdateAgendaItemSequenceInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAgendaItemSequenceInput";

/**
 * Tests for MutationUpdateAgendaItemSequenceInput schema validation.
 * Covers:
 * - required id
 * - required sequence
 * - refinement rule
 * - field-level validation
 * - GraphQL builder integration
 */
describe("MutationUpdateAgendaItemSequenceInput Schema", () => {
	const validId = "550e8400-e29b-41d4-a716-446655440000";

	describe("id field validation", () => {
		it("should accept valid UUID id", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				id: validId,
				sequence: 1,
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID id", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				id: "not-a-uuid",
				sequence: 1,
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing id", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				sequence: 1,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("sequence field validation", () => {
		it("should accept valid integer sequence", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				id: validId,
				sequence: 10,
			});

			expect(result.success).toBe(true);
		});

		it("should reject non-integer sequence", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				id: validId,
				sequence: 1.5,
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero sequence", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				id: validId,
				sequence: 0,
			});

			expect(result.success).toBe(false);
		});

		it("should reject negative sequence", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				id: validId,
				sequence: -1,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("refinement rule", () => {
		it("should reject when required sequence field is missing", () => {
			const result = MutationUpdateAgendaItemSequenceInputSchema.safeParse({
				id: validId,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toBe(
					"Invalid input: expected number, received undefined",
				);
			}
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationUpdateAgendaItemSequenceInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationUpdateAgendaItemSequenceInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationUpdateAgendaItemSequenceInput).toBeDefined();
		});
	});
});
