import { describe, expect, it } from "vitest";
import { mutationUpdateEventInputSchema } from "~/src/graphql/inputs/MutationUpdateEventInput";

/**
 * Tests for MutationUpdateEventInput schema validation.
 * Validates isInviteOnly field and other optional fields.
 */
describe("MutationUpdateEventInput Schema", () => {
	const validInput = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Updated Event Name",
	};

	// isInviteOnly field tests
	it("isInviteOnly - should accept true", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: true,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isInviteOnly).toBe(true);
		}
	});

	it("isInviteOnly - should accept false", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: false,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isInviteOnly).toBe(false);
		}
	});

	it("isInviteOnly - should be undefined when not provided", () => {
		const result = mutationUpdateEventInputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isInviteOnly).toBeUndefined();
		}
	});

	it("isInviteOnly - should reject non-boolean values", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: "true" as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});

	it("isInviteOnly - should reject null", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: null as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});

	it("isInviteOnly - should work with other fields", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: true,
			isPublic: false,
			isRegisterable: true,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isInviteOnly).toBe(true);
			expect(result.data.isPublic).toBe(false);
			expect(result.data.isRegisterable).toBe(true);
		}
	});
});
