import { describe, expect, it } from "vitest";
import {
	AGENDA_ITEM_DESCRIPTION_MAX_LENGTH,
	AGENDA_ITEM_NAME_MAX_LENGTH,
} from "~/src/drizzle/tables/agendaItems";
import {
	MutationCreateAgendaItemInput,
	mutationCreateAgendaItemInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaItemInput";

/**
 * Tests for MutationCreateAgendaItemInput schema validation.
 * Validates the superRefine logic for type-specific field constraints
 * and base field validations for name and description.
 */
describe("MutationCreateAgendaItemInput Schema", () => {
	const validBaseInput = {
		folderId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Agenda Item",
		type: "song" as const,
	};

	describe("type 'note' validation", () => {
		it("should reject when both duration and key are provided for type 'note'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				duration: "30 minutes",
				key: "C Major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const issues = result.error.issues;
				const durationIssue = issues.find((i) => i.path.includes("duration"));
				const keyIssue = issues.find((i) => i.path.includes("key"));
				expect(durationIssue).toBeDefined();
				expect(keyIssue).toBeDefined();
				expect(durationIssue?.message).toContain('type "note"');
				expect(keyIssue?.message).toContain('type "note"');
			}
		});

		it("should reject when only duration is provided for type 'note'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				duration: "30 minutes",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const issues = result.error.issues;
				const durationIssue = issues.find((i) => i.path.includes("duration"));
				expect(durationIssue).toBeDefined();
				expect(durationIssue?.message).toContain('type "note"');
				// Ensure key issue is NOT present since key was not provided
				const keyIssue = issues.find((i) => i.path.includes("key"));
				expect(keyIssue).toBeUndefined();
			}
		});

		it("should reject when only key is provided for type 'note'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
				key: "C Major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const issues = result.error.issues;
				const keyIssue = issues.find((i) => i.path.includes("key"));
				expect(keyIssue).toBeDefined();
				expect(keyIssue?.message).toContain('type "note"');
				// Ensure duration issue is NOT present since duration was not provided
				const durationIssue = issues.find((i) => i.path.includes("duration"));
				expect(durationIssue).toBeUndefined();
			}
		});

		it("should accept type 'note' without duration and key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "note",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("type 'general' validation", () => {
		it("should reject when key is provided for type 'general'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "general",
				key: "C Major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const issues = result.error.issues;
				const keyIssue = issues.find((i) => i.path.includes("key"));
				expect(keyIssue).toBeDefined();
				expect(keyIssue?.message).toContain('type "general"');
			}
		});

		it("should accept type 'general' without key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "general",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'general' with duration (duration is allowed)", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "general",
				duration: "45 minutes",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("type 'scripture' validation", () => {
		it("should reject when key is provided for type 'scripture'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "scripture",
				key: "C Major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const issues = result.error.issues;
				const keyIssue = issues.find((i) => i.path.includes("key"));
				expect(keyIssue).toBeDefined();
				expect(keyIssue?.message).toContain('type "scripture"');
			}
		});

		it("should accept type 'scripture' without key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "scripture",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'scripture' with duration (duration is allowed)", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "scripture",
				duration: "15 minutes",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("type 'song' validation", () => {
		it("should accept type 'song' with key and duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "song",
				key: "G Major",
				duration: "5 minutes",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song' with only key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "song",
				key: "A Minor",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song' with only duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "song",
				duration: "3 minutes",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song' without key and duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "song",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("name field validation", () => {
		it("should accept valid name", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				name: "Valid Agenda Item Name",
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

		it("should reject name exceeding max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at exactly max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("description field validation", () => {
		it("should accept valid description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				description: "A valid agenda item description",
			});
			expect(result.success).toBe(true);
		});

		it("should accept input without description (optional field)", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at exactly max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("required fields validation", () => {
		it("should reject missing folderId", () => {
			const { folderId, ...inputWithoutFolderId } = validBaseInput;
			const result =
				mutationCreateAgendaItemInputSchema.safeParse(inputWithoutFolderId);
			expect(result.success).toBe(false);
		});

		it("should reject missing name", () => {
			const { name, ...inputWithoutName } = validBaseInput;
			const result =
				mutationCreateAgendaItemInputSchema.safeParse(inputWithoutName);
			expect(result.success).toBe(false);
		});

		it("should reject missing type", () => {
			const { type, ...inputWithoutType } = validBaseInput;
			const result =
				mutationCreateAgendaItemInputSchema.safeParse(inputWithoutType);
			expect(result.success).toBe(false);
		});
	});

	describe("folderId field validation", () => {
		it("should accept valid UUID folderId", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				folderId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid UUID folderId", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				folderId: "not-a-valid-uuid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("type field validation", () => {
		it("should reject invalid type value", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				...validBaseInput,
				type: "invalid_type",
			});
			expect(result.success).toBe(false);
		});

		it("should accept all valid type values", () => {
			const validTypes = ["general", "note", "scripture", "song"] as const;
			for (const type of validTypes) {
				const result = mutationCreateAgendaItemInputSchema.safeParse({
					...validBaseInput,
					type,
				});
				expect(result.success).toBe(true);
			}
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should have MutationCreateAgendaItemInput defined in schema", async () => {
			// Dynamically import the schema to trigger builder execution
			// This causes the fields function (lines 62-85) to execute
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationCreateAgendaItemInput).toBeDefined();

			// Verify the input type exists in the schema
			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationCreateAgendaItemInput).toBeDefined();
		});
	});
});
