import { describe, expect, it } from "vitest";
import {
	EVENT_DESCRIPTION_MAX_LENGTH,
	EVENT_LOCATION_MAX_LENGTH,
	EVENT_NAME_MAX_LENGTH,
} from "~/src/drizzle/tables/events";
import { mutationCreateEventInputSchema } from "~/src/graphql/inputs/MutationCreateEventInput";

/**
 * Tests for MutationCreateEventInput schema validation.
 * Validates name, description, and location field trimming and length constraints.
 */
describe("MutationCreateEventInput Schema", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Valid Event Name",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
	};

	// Name field tests
	it("name - should accept valid name", () => {
		const result = mutationCreateEventInputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it("name - should accept minimal input with only required fields", () => {
		const minimalInput = {
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "Minimal Event",
			startAt: new Date("2024-01-01T10:00:00Z"),
			endAt: new Date("2024-01-01T12:00:00Z"),
		};
		const result = mutationCreateEventInputSchema.safeParse(minimalInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.organizationId).toBe(minimalInput.organizationId);
			expect(result.data.name).toBe(minimalInput.name);
			expect(result.data.startAt).toEqual(minimalInput.startAt);
			expect(result.data.endAt).toEqual(minimalInput.endAt);
			// Optional fields should be undefined
			expect(result.data.description).toBeUndefined();
			expect(result.data.location).toBeUndefined();
		}
	});

	it("name - should trim whitespace from name", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			name: "  trimmed name  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("trimmed name");
		}
	});

	it("name - should reject whitespace-only name", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			name: "   ",
		});
		expect(result.success).toBe(false);
	});

	it("name - should reject empty string name", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			name: "",
		});
		expect(result.success).toBe(false);
	});

	it("name - should reject name exceeding length limit", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			name: "a".repeat(EVENT_NAME_MAX_LENGTH + 1),
		});
		expect(result.success).toBe(false);
	});

	it("name - should accept name at exactly max length", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			name: "a".repeat(EVENT_NAME_MAX_LENGTH),
		});
		expect(result.success).toBe(true);
	});

	// Description field tests
	it("description - should accept valid description", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			description: "Valid event description",
		});
		expect(result.success).toBe(true);
	});

	it("description - should trim whitespace from description", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			description: "  trimmed description  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe("trimmed description");
		}
	});

	it("description - should reject whitespace-only description", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			description: "   ",
		});
		expect(result.success).toBe(false);
	});

	it("description - should reject description exceeding length limit", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			description: "a".repeat(EVENT_DESCRIPTION_MAX_LENGTH + 1),
		});
		expect(result.success).toBe(false);
	});

	it("description - should reject empty string description", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			description: "",
		});
		expect(result.success).toBe(false);
	});

	it("description - should accept description at exactly max length", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			description: "a".repeat(EVENT_DESCRIPTION_MAX_LENGTH),
		});
		expect(result.success).toBe(true);
	});

	// Location field tests
	it("location - should accept valid location", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			location: "Conference Room A",
		});
		expect(result.success).toBe(true);
	});

	it("location - should trim whitespace from location", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			location: "  trimmed location  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.location).toBe("trimmed location");
		}
	});

	it("location - should reject location exceeding length limit", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			location: "a".repeat(EVENT_LOCATION_MAX_LENGTH + 1),
		});
		expect(result.success).toBe(false);
	});

	it("location - should reject empty string location", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			location: "",
		});
		expect(result.success).toBe(false);
	});

	it("location - should reject whitespace-only location", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			location: "   ",
		});
		expect(result.success).toBe(false);
	});

	it("location - should accept location at exactly max length", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			location: "a".repeat(EVENT_LOCATION_MAX_LENGTH),
		});
		expect(result.success).toBe(true);
	});

	// Date validation tests
	it("date validation - should reject endAt before startAt", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			startAt: new Date("2024-01-01T12:00:00Z"),
			endAt: new Date("2024-01-01T10:00:00Z"),
		});
		expect(result.success).toBe(false);
	});

	it("date validation - should reject endAt equal to startAt", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			startAt: new Date("2024-01-01T12:00:00Z"),
			endAt: new Date("2024-01-01T12:00:00Z"),
		});
		expect(result.success).toBe(false);
	});

	it("date validation - should accept endAt after startAt", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			startAt: new Date("2024-01-01T10:00:00Z"),
			endAt: new Date("2024-01-01T12:00:00Z"),
		});
		expect(result.success).toBe(true);
	});

	// isInviteOnly field tests
	it("isInviteOnly - should accept true", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: true,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isInviteOnly).toBe(true);
		}
	});

	it("isInviteOnly - should accept false", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: false,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isInviteOnly).toBe(false);
		}
	});

	it("isInviteOnly - should be undefined when not provided", () => {
		const result = mutationCreateEventInputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.isInviteOnly).toBeUndefined();
		}
	});

	it("isInviteOnly - should reject non-boolean values", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: "true" as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});

	it("isInviteOnly - should reject null", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			...validInput,
			isInviteOnly: null as unknown as boolean,
		});
		expect(result.success).toBe(false);
	});
});
