import { describe, expect, it } from "vitest";
import {
	AGENDA_ITEM_DESCRIPTION_MAX_LENGTH,
	AGENDA_ITEM_NAME_MAX_LENGTH,
} from "~/src/drizzle/tables/agendaItems";
import { MutationUpdateAgendaItemInputSchema } from "~/src/graphql/inputs/MutationUpdateAgendaItemInput";

/**
 * Tests for MutationUpdateAgendaItemInput schema validation.
 * Validates name (max 256) and description (max 2048) field trimming and length constraints.
 */
describe("MutationUpdateAgendaItemInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Updated Agenda Item",
	};

	describe("name field", () => {
		it("should accept valid name", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from name", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				name: "  trimmed name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("trimmed name");
			}
		});

		it("should reject whitespace-only name", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				name: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string name", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding length limit", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at exactly max length", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("description field", () => {
		it("should accept valid description", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				description: "Valid agenda item description",
			});
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from description", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				description: "  trimmed description  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBe("trimmed description");
			}
		});

		it("should reject whitespace-only description", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				description: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty description", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding length limit", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH + 1),
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at exactly max length", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				...validInput,
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("refine validation", () => {
		it("should require at least one optional argument", () => {
			const result = MutationUpdateAgendaItemInputSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const hasOptionalArgIssue = result.error.issues.some((i) =>
					i.message.includes("optional argument"),
				);
				expect(hasOptionalArgIssue).toBe(true);
			}
		});
	});
});
