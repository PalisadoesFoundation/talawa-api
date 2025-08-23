import { describe, expect, test } from "vitest";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import {
	formatRecurrenceDescription,
	getRecurrenceLabel,
} from "~/src/utilities/recurrenceFormatter";

// Helper to create a mock recurrence rule
const createMockRule = (
	overrides: Partial<typeof recurrenceRulesTable.$inferSelect>,
): typeof recurrenceRulesTable.$inferSelect => ({
	id: "test-id",
	recurrenceRuleString: "test",
	frequency: "DAILY" as const,
	interval: 1,
	recurrenceStartDate: new Date(),
	recurrenceEndDate: null,
	count: null,
	latestInstanceDate: new Date(),
	byDay: null,
	byMonth: null,
	byMonthDay: null,
	baseRecurringEventId: "test-event-id",
	originalSeriesId: null,
	organizationId: "test-org-id",
	creatorId: "test-creator-id",
	updaterId: null,
	createdAt: new Date(),
	updatedAt: null,
	...overrides,
});

describe("formatRecurrenceDescription", () => {
	test("formats daily recurrence", () => {
		const rule = createMockRule({ frequency: "DAILY", interval: 1 });
		expect(formatRecurrenceDescription(rule)).toBe("Daily");
	});

	test("formats daily recurrence with interval", () => {
		const rule = createMockRule({ frequency: "DAILY", interval: 3 });
		expect(formatRecurrenceDescription(rule)).toBe("Every 3 days");
	});

	test("formats weekly recurrence", () => {
		const rule = createMockRule({ frequency: "WEEKLY", interval: 1 });
		expect(formatRecurrenceDescription(rule)).toBe("Weekly");
	});

	test("formats weekly recurrence with specific days", () => {
		const rule = createMockRule({
			frequency: "WEEKLY",
			interval: 1,
			byDay: ["MO", "WE", "FR"],
		});
		expect(formatRecurrenceDescription(rule)).toBe(
			"Weekly on Monday, Wednesday, Friday",
		);
	});

	test("formats weekly recurrence with interval", () => {
		const rule = createMockRule({ frequency: "WEEKLY", interval: 2 });
		expect(formatRecurrenceDescription(rule)).toBe("Every 2 weeks");
	});

	test("formats weekly recurrence with interval and days", () => {
		const rule = createMockRule({
			frequency: "WEEKLY",
			interval: 2,
			byDay: ["MO"],
		});
		expect(formatRecurrenceDescription(rule)).toBe("Every 2 weeks on Monday");
	});

	test("formats monthly recurrence", () => {
		const rule = createMockRule({ frequency: "MONTHLY", interval: 1 });
		expect(formatRecurrenceDescription(rule)).toBe("Monthly");
	});

	test("formats monthly recurrence on specific day", () => {
		const rule = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [15],
		});
		expect(formatRecurrenceDescription(rule)).toBe("Monthly on the 15th");
	});

	test("formats monthly recurrence on multiple days", () => {
		const rule = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [1, 15, -1],
		});
		expect(formatRecurrenceDescription(rule)).toBe(
			"Monthly on the 1st, 15th, last day",
		);
	});

	test("formats monthly recurrence on positional day", () => {
		const rule = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byDay: ["1MO"],
		});
		expect(formatRecurrenceDescription(rule)).toBe(
			"Monthly on the first Monday",
		);
	});

	test("formats monthly recurrence on last day of week", () => {
		const rule = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byDay: ["-1FR"],
		});
		expect(formatRecurrenceDescription(rule)).toBe(
			"Monthly on the last Friday",
		);
	});

	test("formats yearly recurrence", () => {
		const rule = createMockRule({ frequency: "YEARLY", interval: 1 });
		expect(formatRecurrenceDescription(rule)).toBe("Yearly");
	});

	test("formats yearly recurrence with specific month", () => {
		const rule = createMockRule({
			frequency: "YEARLY",
			interval: 1,
			byMonth: [1],
		});
		expect(formatRecurrenceDescription(rule)).toBe("Yearly in January");
	});

	test("formats yearly recurrence with month and day", () => {
		const rule = createMockRule({
			frequency: "YEARLY",
			interval: 1,
			byMonth: [1],
			byMonthDay: [1],
		});
		expect(formatRecurrenceDescription(rule)).toBe(
			"Yearly in January on the 1st",
		);
	});

	test("formats yearly recurrence with positional day", () => {
		const rule = createMockRule({
			frequency: "YEARLY",
			interval: 1,
			byMonth: [11],
			byDay: ["4TH"],
		});
		expect(formatRecurrenceDescription(rule)).toBe(
			"Yearly in November on the 4th Thursday",
		);
	});

	test("formats recurrence with unknown frequency", () => {
		const rule = createMockRule({
			frequency: "UNKNOWN" as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
			interval: 2,
		});
		expect(formatRecurrenceDescription(rule)).toBe("Every 2 unknown");
	});

	test("handles invalid positional day formats", () => {
		const rule = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byDay: ["INVALID"], // Invalid format that doesn't match the regex
		});
		// Should fallback to just the base text since byDay format is invalid
		expect(formatRecurrenceDescription(rule)).toBe("Monthly");
	});

	test("formats interval-based frequencies", () => {
		const monthlyRule = createMockRule({
			frequency: "MONTHLY",
			interval: 6,
		});
		expect(formatRecurrenceDescription(monthlyRule)).toBe("Every 6 months");

		const yearlyRule = createMockRule({
			frequency: "YEARLY",
			interval: 2,
		});
		expect(formatRecurrenceDescription(yearlyRule)).toBe("Every 2 years");
	});

	test("formats ordinal numbers correctly for various cases", () => {
		// Test ordinal numbers that use different digit logic
		const rule11 = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [11], // Should be "11th" not "11st"
		});
		expect(formatRecurrenceDescription(rule11)).toBe("Monthly on the 11th");

		const rule12 = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [12], // Should be "12th" not "12nd"
		});
		expect(formatRecurrenceDescription(rule12)).toBe("Monthly on the 12th");

		const rule13 = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [13], // Should be "13th" not "13rd"
		});
		expect(formatRecurrenceDescription(rule13)).toBe("Monthly on the 13th");

		const rule21 = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [21], // Should be "21st"
		});
		expect(formatRecurrenceDescription(rule21)).toBe("Monthly on the 21st");

		const rule22 = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [22], // Should be "22nd"
		});
		expect(formatRecurrenceDescription(rule22)).toBe("Monthly on the 22nd");

		const rule23 = createMockRule({
			frequency: "MONTHLY",
			interval: 1,
			byMonthDay: [23], // Should be "23rd"
		});
		expect(formatRecurrenceDescription(rule23)).toBe("Monthly on the 23rd");
	});
});

describe("getRecurrenceLabel", () => {
	test("returns simple frequency labels", () => {
		expect(getRecurrenceLabel(createMockRule({ frequency: "DAILY" }))).toBe(
			"Daily",
		);
		expect(getRecurrenceLabel(createMockRule({ frequency: "WEEKLY" }))).toBe(
			"Weekly",
		);
		expect(getRecurrenceLabel(createMockRule({ frequency: "MONTHLY" }))).toBe(
			"Monthly",
		);
		expect(getRecurrenceLabel(createMockRule({ frequency: "YEARLY" }))).toBe(
			"Yearly",
		);
	});

	test("returns interval-based labels", () => {
		expect(
			getRecurrenceLabel(createMockRule({ frequency: "DAILY", interval: 2 })),
		).toBe("Every 2 days");
		expect(
			getRecurrenceLabel(createMockRule({ frequency: "WEEKLY", interval: 3 })),
		).toBe("Every 3 weeks");
		expect(
			getRecurrenceLabel(createMockRule({ frequency: "MONTHLY", interval: 6 })),
		).toBe("Every 6 months");
		expect(
			getRecurrenceLabel(createMockRule({ frequency: "YEARLY", interval: 2 })),
		).toBe("Every 2 years");
	});

	test("returns label for unknown frequency", () => {
		expect(
			getRecurrenceLabel(
				createMockRule({
					frequency: "UNKNOWN" as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
					interval: 3,
				}),
			),
		).toBe("Every 3 unknown");
	});
});
