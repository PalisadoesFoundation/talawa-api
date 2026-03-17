import { describe, expect, it } from "vitest";
import { mutationUpdateEventInputSchema } from "~/src/graphql/inputs/MutationUpdateEventInput.schema";

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

	it("should fail when no optional arguments are provided", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"At least one optional argument must be provided.",
			);
		}
	});

	it("should fail when endAt is not after startAt", () => {
		const startAt = new Date("2025-06-01T10:00:00Z");
		const endAt = new Date("2025-06-01T09:00:00Z");
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			startAt,
			endAt,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const endAtIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endAt",
			);
			expect(endAtIssue?.message).toBe("End time must be after start time.");
		}
	});

	it("should fail when endAt equals startAt", () => {
		const startAt = new Date("2025-06-01T10:00:00Z");
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			startAt,
			endAt: startAt,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const endAtIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endAt",
			);
			expect(endAtIssue).toBeDefined();
		}
	});

	it("should fail when endDate is not after startDate", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			startDate: "2025-06-10",
			endDate: "2025-06-05",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const endDateIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endDate",
			);
			expect(endDateIssue?.message).toBe(
				"End date must be after start date for all-day events.",
			);
		}
	});

	it("should fail when endDate equals startDate", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			startDate: "2025-06-10",
			endDate: "2025-06-10",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const endDateIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endDate",
			);
			expect(endDateIssue).toBeDefined();
			expect(endDateIssue?.message).toBe(
				"End date must be after start date for all-day events.",
			);
		}
	});

	it("should fail when allDay is true and startAt is provided", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			allDay: true,
			startAt: new Date("2025-06-01T10:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const startAtIssue = result.error.issues.find(
				(issue) => issue.path[0] === "startAt",
			);
			expect(startAtIssue?.message).toBe(
				"Cannot provide startAt when allDay is true. Use startDate instead.",
			);
		}
	});

	it("should fail when allDay is true and endAt is provided", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			allDay: true,
			endAt: new Date("2025-06-01T11:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const endAtIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endAt",
			);
			expect(endAtIssue?.message).toBe(
				"Cannot provide endAt when allDay is true. Use endDate instead.",
			);
		}
	});

	it("should fail when allDay is false and startDate is provided", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			allDay: false,
			startDate: "2025-06-10",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const startDateIssue = result.error.issues.find(
				(issue) => issue.path[0] === "startDate",
			);
			expect(startDateIssue?.message).toBe(
				"Cannot provide startDate when allDay is false. Use startAt instead.",
			);
		}
	});

	it("should fail when allDay is false and endDate is provided", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			allDay: false,
			endDate: "2025-06-11",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const endDateIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endDate",
			);
			expect(endDateIssue?.message).toBe(
				"Cannot provide endDate when allDay is false. Use endAt instead.",
			);
		}
	});

	it("should fail when allDay is true and timed plus all-day fields are mixed", () => {
		const result = mutationUpdateEventInputSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			allDay: true,
			startAt: new Date("2025-06-01T10:00:00Z"),
			startDate: "2025-06-10",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const mixedIssue = result.error.issues.find(
				(issue) => issue.path[0] === "startAt",
			);
			expect(mixedIssue).toBeDefined();
		}
	});
});
