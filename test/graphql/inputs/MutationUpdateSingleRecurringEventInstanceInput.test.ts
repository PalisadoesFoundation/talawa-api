import { describe, expect, it } from "vitest";
import { mutationUpdateSingleRecurringEventInstanceInputSchema } from "~/src/graphql/inputs/MutationUpdateSingleRecurringEventInstanceInput";

describe("MutationUpdateSingleRecurringEventInstanceInput Schema", () => {
	const validId = "550e8400-e29b-41d4-a716-446655440000";

	it("should accept a valid minimal update payload", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				name: "Updated instance name",
			});

		expect(result.success).toBe(true);
	});

	it("should reject invalid UUID for id", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: "not-a-uuid",
				name: "Updated instance name",
			});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"Must be a valid UUID for the recurring event instance ID.",
			);
		}
	});

	it("should reject when no updatable fields are provided", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
			});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) =>
					i.message.includes("At least one field must be provided for update."),
				),
			).toBe(true);
		}
	});

	it("should reject name when empty string is provided", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				name: "",
			});

		expect(result.success).toBe(false);
	});

	it("should reject description exceeding max length", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				description: "a".repeat(2049),
			});

		expect(result.success).toBe(false);
	});

	it("should reject location exceeding max length", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				location: "a".repeat(1025),
			});

		expect(result.success).toBe(false);
	});

	it("should accept boolean flags set together", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				allDay: true,
				isPublic: false,
				isRegisterable: true,
				isInviteOnly: false,
			});

		expect(result.success).toBe(true);
	});

	it("should reject when endAt is before startAt", () => {
		const startAt = new Date("2025-06-01T10:00:00Z");
		const endAt = new Date("2025-06-01T09:30:00Z");
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				startAt,
				endAt,
			});

		expect(result.success).toBe(false);
		if (!result.success) {
			const endAtIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endAt",
			);
			expect(endAtIssue?.message).toBe(
				`End time must be after start time: ${startAt.toISOString()}.`,
			);
		}
	});

	it("should reject when endAt equals startAt", () => {
		const startAt = new Date("2025-06-01T10:00:00Z");
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
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

	it("should reject when endDate is before startDate", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				startDate: "2025-06-10",
				endDate: "2025-06-09",
			});

		expect(result.success).toBe(false);
		if (!result.success) {
			const endDateIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endDate",
			);
			expect(endDateIssue?.message).toBe(
				"End date must be after start date: 2025-06-10.",
			);
		}
	});

	it("should reject when endDate equals startDate", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				startDate: "2025-06-10",
				endDate: "2025-06-10",
			});

		expect(result.success).toBe(false);
		if (!result.success) {
			const endDateIssue = result.error.issues.find(
				(issue) => issue.path[0] === "endDate",
			);
			expect(endDateIssue).toBeDefined();
		}
	});

	it("should accept valid timed range", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				startAt: new Date("2025-06-01T10:00:00Z"),
				endAt: new Date("2025-06-01T11:00:00Z"),
			});

		expect(result.success).toBe(true);
	});

	it("should accept valid all-day range", () => {
		const result =
			mutationUpdateSingleRecurringEventInstanceInputSchema.safeParse({
				id: validId,
				startDate: "2025-06-10",
				endDate: "2025-06-11",
			});

		expect(result.success).toBe(true);
	});
});
