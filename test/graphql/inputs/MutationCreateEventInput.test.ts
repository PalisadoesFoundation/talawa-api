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

	// All-day event validation tests (allDay = true branch of superRefine)
	it("all-day validation - should reject allDay:true when startDate is missing", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "All-Day Event",
			allDay: true,
			endDate: "2024-01-02",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("startDate");
		}
	});

	it("all-day validation - should reject allDay:true when endDate is missing", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "All-Day Event",
			allDay: true,
			startDate: "2024-01-01",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("endDate");
		}
	});

	it("all-day validation - should reject allDay:true when endDate is not greater than startDate", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "All-Day Event",
			allDay: true,
			startDate: "2024-01-05",
			endDate: "2024-01-05",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const endDateIssue = result.error.issues.find(
				(i) => i.path.join(".") === "endDate",
			);
			expect(endDateIssue).toBeDefined();
			expect(endDateIssue?.message).toContain("2024-01-05");
		}
	});

	it("all-day validation - should accept allDay:true with valid startDate and endDate", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "All-Day Event",
			allDay: true,
			startDate: "2024-01-01",
			endDate: "2024-01-02",
		});
		expect(result.success).toBe(true);
	});

	// Timed event validation tests (else branch of superRefine)
	it("timed validation - should reject when startAt is missing", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "Timed Event",
			endAt: new Date("2024-01-01T12:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("startAt");
		}
	});

	it("timed validation - should reject when endAt is missing", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "Timed Event",
			startAt: new Date("2024-01-01T10:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("endAt");
		}
	});

	it("all-day validation - should reject allDay:true when startAt/endAt are also provided", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "All-Day Event",
			allDay: true,
			startDate: "2024-01-01",
			endDate: "2024-01-02",
			startAt: new Date("2024-01-01T10:00:00Z"),
			endAt: new Date("2024-01-01T11:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("startAt");
			expect(paths).toContain("endAt");
		}
	});

	it("timed validation - should reject when startDate/endDate are also provided", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "Timed Event",
			startAt: new Date("2024-01-01T10:00:00Z"),
			endAt: new Date("2024-01-01T11:00:00Z"),
			startDate: "2024-01-01",
			endDate: "2024-01-02",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("startDate");
			expect(paths).toContain("endDate");
		}
	});

	it("timed validation - should reject when only startDate is provided with timed fields", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "Timed Event",
			startAt: new Date("2024-01-01T10:00:00Z"),
			endAt: new Date("2024-01-01T11:00:00Z"),
			startDate: "2024-01-01",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("startDate");
		}
	});

	it("timed validation - should reject when only endDate is provided with timed fields", () => {
		const result = mutationCreateEventInputSchema.safeParse({
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
			name: "Timed Event",
			startAt: new Date("2024-01-01T10:00:00Z"),
			endAt: new Date("2024-01-01T11:00:00Z"),
			endDate: "2024-01-02",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("endDate");
		}
	});
});
