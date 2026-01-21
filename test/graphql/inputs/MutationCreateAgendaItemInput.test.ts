import { describe, expect, it } from "vitest";
import {
	MutationCreateAgendaItemInput,
	mutationCreateAgendaItemInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaItemInput";

/**
 * Tests for MutationCreateAgendaItemInput schema validation.
 * Covers base validation, optional fields, array constraints,
 * enum checks, superRefine conditional rules, and GraphQL integration.
 */
describe("MutationCreateAgendaItemInput Schema", () => {
	const validBaseInput = {
		eventId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Agenda Item",
		sequence: 1,
		type: "general",
	};

	describe("base required fields validation", () => {
		it("should accept a valid base input", () => {
			const result =
				mutationCreateAgendaItemInputSchema.safeParse(validBaseInput);
			expect(result.success).toBe(true);
		});

		it("should reject missing eventId", () => {
			const { eventId: _eventId, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing name", () => {
			const { name: _name, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing sequence", () => {
			const { sequence: _sequence, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing type", () => {
			const { type: _type, ...input } = validBaseInput;
			const result = mutationCreateAgendaItemInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe("UUID field validation", () => {
		it("should accept valid folderId and categoryId UUIDs", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				folderId: "123e4567-e89b-12d3-a456-426614174000",
				categoryId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid folderId UUID", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				folderId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid categoryId UUID", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				categoryId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("url field validation", () => {
		it("should accept valid url array", () => {
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
						name: "file.jpeg",
						mimeType: "IMAGE_JPEG",
						objectName: "object-name",
						fileHash: "hash",
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("should reject attachments with empty required fields", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				attachments: [
					{
						name: "",
						mimeType: "application/pdf",
						objectName: "",
						fileHash: "",
					},
				],
			});
			expect(result.success).toBe(false);
		});

		it("should reject more than 10 attachments", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				attachments: Array.from({ length: 11 }).map((_, i) => ({
					name: `file-${i}`,
					mimeType: "application/pdf",
					objectName: `object-${i}`,
					fileHash: `hash-${i}`,
				})),
			});
			expect(result.success).toBe(false);
		});
	});

	describe("superRefine conditional validation", () => {
		it('should reject duration and key for type "note"', () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				duration: "10m",
				key: "C",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues).toHaveLength(2);
		});

		it('should reject only duration for type "note"', () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				duration: "10m",
			});
			expect(result.success).toBe(false);
		});

		it('should reject only key for type "note"', () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				key: "C",
			});
			expect(result.success).toBe(false);
		});

		it('should reject key for type "general"', () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "general",
				key: "C",
			});
			expect(result.success).toBe(false);
		});

		it('should reject key for type "scripture"', () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "scripture",
				key: "C",
			});
			expect(result.success).toBe(false);
		});

		it('should accept key for type "song"', () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "song",
				key: "C",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("GraphQL Builder Types", () => {
		it("should define MutationCreateAgendaItemInput in schema", async () => {
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationCreateAgendaItemInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationCreateAgendaItemInput).toBeDefined();
			expect(typeMap.AgendaItemUrlInput).toBeDefined();
			expect(typeMap.AgendaItemAttachmentInput).toBeDefined();
		});
	});
});
