import { describe, expect, it } from "vitest";
import {
	MutationCreateAgendaFolderInput,
	mutationCreateAgendaFolderInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaFolderInput";

/**
 * Tests for MutationCreateAgendaFolderInput schema validation.
 * Covers base field validation, optional/required fields,
 * numeric constraints, UUID checks, and GraphQL builder integration.
 */
describe("MutationCreateAgendaFolderInput Schema", () => {
	const validBaseInput = {
		eventId: "550e8400-e29b-41d4-a716-446655440000",
		organizationId: "123e4567-e89b-12d3-a456-426614174000",
		name: "Agenda Folder",
		sequence: 1,
	};

	describe("name field validation", () => {
		it("should accept a valid name", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				name: "Valid Folder Name",
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty name", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding max length", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				name: "a".repeat(257),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at max length", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				name: "a".repeat(256),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("description field validation", () => {
		it("should accept valid description", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				description: "This is a valid description",
			});
			expect(result.success).toBe(true);
		});

		it("should accept missing description (optional field)", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty description", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding max length", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				description: "a".repeat(2049),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at max length", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				description: "a".repeat(2048),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("eventId field validation", () => {
		it("should accept valid UUID eventId", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				eventId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID eventId", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				eventId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("organizationId field validation", () => {
		it("should accept valid UUID organizationId", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID organizationId", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				organizationId: "invalid-org-id",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("sequence field validation", () => {
		it("should accept zero sequence", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				sequence: 0,
			});
			expect(result.success).toBe(false);
		});

		it("should reject negative sequence", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				sequence: -1,
			});
			expect(result.success).toBe(false);
		});

		it("should accept a valid integer sequence", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				sequence: 10,
			});
			expect(result.success).toBe(true);
		});

		it("should reject non-integer sequence", () => {
			const result = mutationCreateAgendaFolderInputSchema.safeParse({
				...validBaseInput,
				sequence: 1.5,
			});
			expect(result.success).toBe(false);
		});

		it("should accept missing sequence (optional field)", () => {
			const { sequence: _sequence, ...input } = validBaseInput;
			const result = mutationCreateAgendaFolderInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});
	});

	describe("required fields validation", () => {
		it("should reject missing eventId", () => {
			const { eventId: _eventId, ...input } = validBaseInput;
			const result = mutationCreateAgendaFolderInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing name", () => {
			const { name: _name, ...input } = validBaseInput;
			const result = mutationCreateAgendaFolderInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing organizationId", () => {
			const { organizationId: _organizationId, ...input } = validBaseInput;
			const result = mutationCreateAgendaFolderInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationCreateAgendaFolderInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationCreateAgendaFolderInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationCreateAgendaFolderInput).toBeDefined();
		});
	});
});
