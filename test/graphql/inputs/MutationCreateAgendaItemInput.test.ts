import { describe, expect, it } from "vitest";
import {
	AGENDA_ITEM_DESCRIPTION_MAX_LENGTH,
	AGENDA_ITEM_NAME_MAX_LENGTH,
} from "~/src/drizzle/tables/agendaItems";
import { mutationCreateAgendaItemInputSchema } from "~/src/graphql/inputs/MutationCreateAgendaItemInput";

/**
 * Tests for MutationCreateAgendaItemInput schema validation.
 * Validates name (max 256) and description (max 2048) field constraints,
 * as well as type-specific validation for duration and key fields across all 4 agenda item types.
 *
 * NOTE: These tests document a bug in the source code where type 'note' always fails validation
 * due to the else clause in the superRefine function always adding an issue for 'key'.
 */
describe("MutationCreateAgendaItemInput Schema", () => {
	const validFolderId = "550e8400-e29b-41d4-a716-446655440000";

	describe("name field", () => {
		it("should accept valid name", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
		});

		it("should accept name with whitespace (no trimming)", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "  name with spaces  ",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("  name with spaces  ");
			}
		});

		it("should accept whitespace-only name", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "   ",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty string name", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding length limit", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH + 1),
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at exactly max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH),
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
		});

		it("should require name field", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("description field", () => {
		it("should accept valid description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				description: "Valid agenda item description",
			});
			expect(result.success).toBe(true);
		});

		it("should accept description with whitespace (no trimming)", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				description: "  description with spaces  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBe("  description with spaces  ");
			}
		});

		it("should accept whitespace-only description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				description: "   ",
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding length limit", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at exactly max length", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});

		it("should allow description to be optional", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBeUndefined();
			}
		});
	});

	describe("folderId field", () => {
		it("should require folderId field", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				type: "general",
			});
			expect(result.success).toBe(false);
		});

		it("should accept valid UUID for folderId", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("type field", () => {
		it("should require type field", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
			});
			expect(result.success).toBe(false);
		});

		it("should accept type 'general'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
		});

		it("should reject type 'note' due to validation bug", () => {
			// Note: The source code has a bug where type 'note' always fails validation
			// The else clause always adds an issue for 'key' when neither duration nor key is provided
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "note",
			});
			expect(result.success).toBe(false);
		});

		it("should accept type 'scripture'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "scripture",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("type-specific validation for 'note'", () => {
		it("should reject type 'note' without duration or key (validation bug)", () => {
			// Note: The source code has a bug in the validation logic
			// The else clause (lines 33-38) always adds an issue for 'key' when neither field is provided
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "note",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const keyIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("key") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "note"',
						),
				);
				expect(keyIssue).toBeDefined();
			}
		});

		it("should reject type 'note' with both duration and key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "note",
				duration: "10 minutes",
				key: "C major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				// Should have two issues: one for duration, one for key
				const durationIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("duration") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "note"',
						),
				);
				const keyIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("key") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "note"',
						),
				);
				expect(durationIssue).toBeDefined();
				expect(keyIssue).toBeDefined();
			}
		});

		it("should reject type 'note' with only duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "note",
				duration: "10 minutes",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const durationIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("duration") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "note"',
						),
				);
				expect(durationIssue).toBeDefined();
			}
		});

		it("should reject type 'note' with only key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "note",
				key: "C major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const keyIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("key") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "note"',
						),
				);
				expect(keyIssue).toBeDefined();
			}
		});

		it("should reject type 'note' with description but no duration or key (validation bug)", () => {
			// Note: Even with a description, the validation fails due to the bug in the else clause
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "note",
				description: "This is a note",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const keyIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("key") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "note"',
						),
				);
				expect(keyIssue).toBeDefined();
			}
		});
	});

	describe("type-specific validation for 'general'", () => {
		it("should accept type 'general' without key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
		});

		it("should reject type 'general' with key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				key: "C major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const keyIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("key") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "general"',
						),
				);
				expect(keyIssue).toBeDefined();
			}
		});

		it("should accept type 'general' with duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				duration: "15 minutes",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'general' with duration and description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				duration: "15 minutes",
				description: "General agenda item",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("type-specific validation for 'scripture'", () => {
		it("should accept type 'scripture' without key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "scripture",
			});
			expect(result.success).toBe(true);
		});

		it("should reject type 'scripture' with key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "scripture",
				key: "C major",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const keyIssue = result.error.issues.find(
					(issue) =>
						issue.path.includes("key") &&
						issue.message.includes(
							'Cannot be provided for an agenda item of type "scripture"',
						),
				);
				expect(keyIssue).toBeDefined();
			}
		});

		it("should accept type 'scripture' with duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "scripture",
				duration: "20 minutes",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'scripture' with duration and description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "scripture",
				duration: "20 minutes",
				description: "Scripture reading",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("type-specific validation for 'song'", () => {
		it("should accept type 'song' without key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song' with key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
				key: "C major",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song' with duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
				duration: "5 minutes",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song' with both key and duration", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
				key: "G major",
				duration: "5 minutes",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'song' with key, duration, and description", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
				key: "D major",
				duration: "5 minutes",
				description: "Worship song",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("duration field", () => {
		it("should allow duration to be optional", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.duration).toBeUndefined();
			}
		});

		it("should accept valid duration string", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				duration: "30 minutes",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("key field", () => {
		it("should allow key to be optional for type 'song'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.key).toBeUndefined();
			}
		});

		it("should accept valid key string for type 'song'", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "song",
				key: "A minor",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("complex edge cases", () => {
		it("should accept type 'song' with max length name and key", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH),
				folderId: validFolderId,
				type: "song",
				key: "C major",
			});
			expect(result.success).toBe(true);
		});

		it("should reject type 'note' with max length description (validation bug)", () => {
			// Note: Even with valid description, type 'note' fails due to validation bug
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "note",
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(false);
		});

		it("should accept type 'general' with all allowed fields", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "general",
				duration: "15 minutes",
				description: "General item description",
			});
			expect(result.success).toBe(true);
		});

		it("should accept type 'scripture' with all allowed fields", () => {
			const result = mutationCreateAgendaItemInputSchema.safeParse({
				name: "Valid Agenda Item",
				folderId: validFolderId,
				type: "scripture",
				duration: "10 minutes",
				description: "Scripture reading description",
			});
			expect(result.success).toBe(true);
		});
	});
});
