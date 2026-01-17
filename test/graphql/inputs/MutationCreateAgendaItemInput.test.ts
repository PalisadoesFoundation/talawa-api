import { describe, expect, it } from "vitest";
import { AGENDA_ITEM_NOTES_MAX_LENGTH } from "~/src/drizzle/tables/agendaItems";
import {
	MutationCreateAgendaItemInput,
	mutationCreateAgendaItemInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaItemInput";

/**
 * Tests for MutationCreateAgendaItemInput schema validation.
 * Covers base field validation, optional/required fields,
 * enum constraints, conditional refinement rules,
 * nested object validation, and GraphQL builder integration.
 */
describe("MutationCreateAgendaItemInput Schema", () => {
	const validBaseInput = {
		eventId: "550e8400-e29b-41d4-a716-446655440000",
		folderId: "123e4567-e89b-12d3-a456-426614174000",
		categoryId: "123e4567-e89b-12d3-a456-426614174111",
		name: "Agenda Item",
		sequence: 1,
		type: "general",
	};

	describe("name field validation", () => {
		it("should accept a valid name", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				name: "Valid Agenda Item",
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty name", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				name: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("UUID field validation", () => {
		it("should reject invalid eventId", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				eventId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid folderId", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				folderId: "invalid-folder-id",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid categoryId", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				categoryId: "invalid-category-id",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("notes field validation", () => {
		it("should accept notes within max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				notes: "a".repeat(AGENDA_ITEM_NOTES_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});

		it("should reject notes exceeding max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				notes: "a".repeat(AGENDA_ITEM_NOTES_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});
	});

	describe("sequence field validation", () => {
		it("should accept a valid sequence", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				sequence: 10,
			});
			expect(result.success).toBe(true);
		});

		it("should reject zero sequence", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				sequence: 0,
			});
			expect(result.success).toBe(false);
		});

		it("should reject negative sequence", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				sequence: -1,
			});
			expect(result.success).toBe(false);
		});

		it("should reject non-integer sequence", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				sequence: 1.5,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("type field validation", () => {
		it("should accept valid enum type", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid enum type", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "invalid-type",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("url field validation", () => {
		it("should accept valid url objects", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				url: [{ url: "https://example.com" }],
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid url format", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				url: [{ url: "not-a-url" }],
			});
			expect(result.success).toBe(false);
		});
	});

	describe("attachments field validation", () => {
		it("should accept valid attachments", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				attachments: [
					{
						name: "file.png",
						mimeType: "image/png",
						objectName: "object-key",
						fileHash: "hash123",
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("should reject attachment with empty name", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				attachments: [
					{
						name: "",
						mimeType: "image/png",
						objectName: "object-key",
						fileHash: "hash123",
					},
				],
			});
			expect(result.success).toBe(false);
		});
	});

	describe("superRefine conditional validation", () => {
		it("should reject duration and key for type note", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				duration: "10m",
				key: "C",
			});
			expect(result.success).toBe(false);
		});

		it("should reject duration only for type note", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				duration: "10m",
			});
			expect(result.success).toBe(false);
		});

		it("should reject key only for type note", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				key: "C",
			});
			expect(result.success).toBe(false);
		});

		it("should reject key for type general", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "general",
				key: "C",
			});
			expect(result.success).toBe(false);
		});

		it("should reject key for type scripture", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "scripture",
				key: "C",
			});
			expect(result.success).toBe(false);
		});

		it("should allow key for song type", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "song",
				key: "C",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("required fields validation", () => {
		it("should accept duration for type general", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "general",
				duration: "10m",
			});
			expect(result.success).toBe(true);
		});

		it("should accept duration for type song", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "song",
				duration: "10m",
			});
			expect(result.success).toBe(true);
		});

		it("should reject missing eventId", () => {
			const { eventId: _eventId, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should accept missing folderId (optional)", () => {
			const { folderId: _folderId, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it("should accept missing categoryId (optional)", () => {
			const { categoryId: _categoryId, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it("should reject missing name", () => {
			const { name: _name, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing type", () => {
			const { type: _type, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should define MutationCreateAgendaItemInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationCreateAgendaItemInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationCreateAgendaItemInput).toBeDefined();
		});
	});
});
