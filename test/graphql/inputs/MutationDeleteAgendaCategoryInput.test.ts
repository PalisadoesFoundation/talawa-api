import { describe, expect, it } from "vitest";
import {
	MutationDeleteAgendaCategoryInput,
	mutationDeleteAgendaCategoryInputSchema,
} from "~/src/graphql/inputs/MutationDeleteAgendaCategoryInput";

describe("MutationDeleteAgendaCategoryInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
	};

	describe("id field validation", () => {
		it("should accept a valid UUID id", () => {
			const result =
				mutationDeleteAgendaCategoryInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject missing id", () => {
			const result = mutationDeleteAgendaCategoryInputSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("should reject invalid UUID id", () => {
			const result = mutationDeleteAgendaCategoryInputSchema.safeParse({
				id: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("required fields validation", () => {
		it("should reject null id", () => {
			const result = mutationDeleteAgendaCategoryInputSchema.safeParse({
				id: null,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("GraphQL Builder Type", () => {
		it("should have MutationDeleteAgendaCategoryInput defined in schema", async () => {
			// Import schema to trigger builder execution
			const { schema } = await import("~/src/graphql/schema");

			expect(schema).toBeDefined();
			expect(MutationDeleteAgendaCategoryInput).toBeDefined();

			const typeMap = schema.getTypeMap();
			expect(typeMap.MutationDeleteAgendaCategoryInput).toBeDefined();
		});
	});
});
