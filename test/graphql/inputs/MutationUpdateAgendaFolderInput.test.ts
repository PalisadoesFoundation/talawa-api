import { describe, expect, it } from "vitest";
import {
	MutationUpdateAgendaFolderInput,
	mutationUpdateAgendaFolderInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAgendaFolderInput";

/**
 * Tests for MutationUpdateAgendaFolderInput schema validation.
 * Covers required id, optional update fields,
 * refinement rule (at least one field required),
 * field-level validation, and GraphQL builder integration.
 */
describe("MutationUpdateAgendaFolderInput Schema", () => {
	const validId = "550e8400-e29b-41d4-a716-446655440000";

	describe("id field validation", () => {
		it("should accept valid UUID id", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				name: "Updated Name",
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID id", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: "not-a-uuid",
				name: "Updated Name",
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing id", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				name: "Updated Name",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("refinement rule", () => {
		it("should accept when name is provided", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				name: "New Folder Name",
			});

			expect(result.success).toBe(true);
		});

		it("should accept when description is provided", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				description: "Updated description",
			});

			expect(result.success).toBe(true);
		});

		it("should accept when sequence is provided", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				sequence: 3,
			});

			expect(result.success).toBe(true);
		});

		it("should accept when multiple fields are provided", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				name: "New Name",
				description: "New description",
				sequence: 2,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("name field validation", () => {
		it("should reject empty name", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				name: "",
			});

			expect(result.success).toBe(false);
		});

		it("should reject name exceeding max length", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				name: "a".repeat(257),
			});

			expect(result.success).toBe(false);
		});

		it("should accept name at max length", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				name: "a".repeat(256),
			});

			expect(result.success).toBe(true);
		});
	});

	describe("description field validation", () => {
		it("should reject empty description", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				description: "",
			});

			expect(result.success).toBe(false);
		});

		it("should reject description exceeding max length", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				description: "a".repeat(2049),
			});

			expect(result.success).toBe(false);
		});

		it("should accept description at max length", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				description: "a".repeat(2048),
			});

			expect(result.success).toBe(true);
		});
	});

	describe("sequence field validation", () => {
		it("should accept valid integer sequence", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				sequence: 10,
			});

			expect(result.success).toBe(true);
		});

		it("should reject non-integer sequence", () => {
			const result = mutationUpdateAgendaFolderInputSchema.safeParse({
				id: validId,
				sequence: 1.25,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationUpdateAgendaFolderInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationUpdateAgendaFolderInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationUpdateAgendaFolderInput).toBeDefined();
		});
	});
});
