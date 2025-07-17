import { describe, expect, it } from "vitest";
import type { z } from "zod";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { recurrenceInputSchema } from "~/src/graphql/inputs/RecurrenceInput";
import {
	buildRRuleString,
	calculateCompletionDateFromCount,
	calculateInstancesPerMonth,
	estimateInstanceCount,
	getEventType,
	isCountBasedEvent,
	isEndDateBasedEvent,
	isNeverEndingEvent,
	normalizeRecurrenceRule,
	validateRecurrenceInput,
	validateRecurrenceRule,
} from "~/src/utilities/recurringEventHelpers";

describe("recurringEventHelpers", () => {
	describe("buildRRuleString", () => {
		const startDate = new Date("2025-01-01T00:00:00.000Z");
		it.each([
			[{ frequency: "DAILY" }, "RRULE:FREQ=DAILY"],
			[
				{ frequency: "WEEKLY", interval: 2, byDay: ["MO", "WE", "FR"] },
				"RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR",
			],
			[
				{ frequency: "MONTHLY", endDate: new Date("2025-06-01T00:00:00.000Z") },
				"RRULE:FREQ=MONTHLY;UNTIL=20250601T000000Z",
			],
			[{ frequency: "YEARLY", count: 5 }, "RRULE:FREQ=YEARLY;COUNT=5"],
			[
				{
					frequency: "MONTHLY",
					interval: 3,
					count: 10,
					byMonth: [1, 2, 3],
					byMonthDay: [1, 15],
				},
				"RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=10;BYMONTH=1,2,3;BYMONTHDAY=1,15",
			],
		])(
			"should build the correct RRULE string for various inputs",
			(recurrence, expected) => {
				const rrule = buildRRuleString(
					recurrence as z.infer<typeof recurrenceInputSchema>,
					startDate,
				);
				expect(rrule).toBe(expected);
			},
		);
	});

	describe("validateRecurrenceInput", () => {
		const startDate = new Date("2025-01-01T00:00:00.000Z");
		it.each([
			[
				{ frequency: "WEEKLY", endDate: new Date("2025-02-01T00:00:00.000Z") },
				true,
				[],
			],
			[
				{ frequency: "DAILY", endDate: new Date("2024-12-31T00:00:00.000Z") },
				false,
				["Recurrence end date must be after event start date"],
			],
			[
				{ frequency: "DAILY", count: 0 },
				false,
				["Recurrence count must be at least 1"],
			],
			[
				{ frequency: "WEEKLY", byDay: ["MO", "INVALID"] },
				false,
				["Invalid day code: INVALID"],
			],
			[
				{ frequency: "MONTHLY", byMonth: [1, 13] },
				false,
				["Invalid month: 13"],
			],
			[
				{ frequency: "MONTHLY", byMonthDay: [1, 32] },
				false,
				["Invalid month day: 32"],
			],
		])(
			"should validate various recurrence inputs",
			(recurrence, isValid, errors) => {
				const result = validateRecurrenceInput(
					recurrence as z.infer<typeof recurrenceInputSchema>,
					startDate,
				);
				expect(result.isValid).toBe(isValid);
				expect(result.errors).toEqual(errors);
			},
		);
	});

	describe("normalizeRecurrenceRule", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			organizationId: "1",
			creatorId: "1",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: null,
			latestInstanceDate: new Date(),
			frequency: "DAILY",
			interval: 1,
			count: null,
			recurrenceStartDate: new Date("2025-01-01T00:00:00.000Z"),
			recurrenceRuleString: "RRULE:FREQ=DAILY",
			byDay: null,
			byMonth: null,
			byMonthDay: null,
			recurrenceEndDate: null,
		};

		it.each([
			[
				{
					...baseRule,
					count: 5,
					recurrenceRuleString: "RRULE:FREQ=DAILY;COUNT=5",
				},
				new Date("2025-01-05T00:00:00.000Z"),
			],
			[
				{
					...baseRule,
					count: 5,
					recurrenceEndDate: new Date("2025-01-05T00:00:00.000Z"),
					recurrenceRuleString: "RRULE:FREQ=DAILY;COUNT=5",
				},
				new Date("2025-01-05T00:00:00.000Z"),
			],
			[baseRule, null],
		])("should normalize the recurrence rule", (rule, expectedEndDate) => {
			const normalizedRule = normalizeRecurrenceRule(rule);
			if (expectedEndDate) {
				expect(normalizedRule.recurrenceEndDate).toEqual(expectedEndDate);
			} else {
				expect(normalizedRule).toEqual(rule);
			}
		});
	});

	describe("calculateCompletionDateFromCount", () => {
		const startDate = new Date("2025-01-01T00:00:00.000Z");
		it.each([
			[10, "DAILY", 1, new Date("2025-01-10T00:00:00.000Z")],
			[5, "WEEKLY", 2, new Date("2025-02-26T00:00:00.000Z")],
			[6, "MONTHLY", 1, new Date("2025-06-01T00:00:00.000Z")],
			[3, "YEARLY", 1, new Date("2027-01-01T00:00:00.000Z")],
		] as const)(
			"should calculate the correct completion date",
			(count, frequency, interval, expected) => {
				const completionDate = calculateCompletionDateFromCount(
					startDate,
					count,
					frequency,
					interval,
				);
				expect(completionDate).toEqual(expected);
			},
		);
	});

	describe("estimateInstanceCount", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			organizationId: "1",
			creatorId: "1",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: null,
			latestInstanceDate: new Date(),
			frequency: "DAILY",
			interval: 1,
			count: null,
			recurrenceStartDate: new Date("2025-01-01T00:00:00.000Z"),
			recurrenceRuleString: "RRULE:FREQ=DAILY",
			byDay: null,
			byMonth: null,
			byMonthDay: null,
			recurrenceEndDate: null,
		};

		it.each([
			[
				{
					...baseRule,
					count: 10,
					recurrenceRuleString: "RRULE:FREQ=DAILY;COUNT=10",
				},
				10,
				undefined,
			],
			[
				{
					...baseRule,
					recurrenceEndDate: new Date("2025-01-10T00:00:00.000Z"),
					recurrenceRuleString: "RRULE:FREQ=DAILY;UNTIL=20250110T000000Z",
				},
				10,
				undefined,
			],
			[
				{
					...baseRule,
					frequency: "MONTHLY",
					recurrenceRuleString: "RRULE:FREQ=MONTHLY",
				},
				12,
				12,
			],
		] as const)(
			"should estimate the instance count",
			(rule, expected, estimationWindow) => {
				expect(estimateInstanceCount(rule, estimationWindow)).toBe(expected);
			},
		);
	});

	describe("Event Type Functions", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			organizationId: "1",
			creatorId: "1",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: null,
			latestInstanceDate: new Date(),
			frequency: "DAILY",
			interval: 1,
			count: null,
			recurrenceStartDate: new Date("2025-01-01T00:00:00.000Z"),
			recurrenceRuleString: "RRULE:FREQ=DAILY",
			byDay: null,
			byMonth: null,
			byMonthDay: null,
			recurrenceEndDate: null,
		};

		it.each([
			[baseRule, true, false, false, "NEVER_ENDING"],
			[{ ...baseRule, count: 10 }, false, true, false, "COUNT_BASED"],
			[
				{ ...baseRule, recurrenceEndDate: new Date() },
				false,
				false,
				true,
				"END_DATE_BASED",
			],
			[
				{ ...baseRule, count: 10, recurrenceEndDate: new Date() },
				false,
				false,
				true,
				"HYBRID",
			],
		] as const)(
			"should correctly classify event types",
			(rule, isNever, isCount, isEndDate, eventType) => {
				expect(isNeverEndingEvent(rule)).toBe(isNever);
				expect(isCountBasedEvent(rule)).toBe(isCount);
				expect(isEndDateBasedEvent(rule)).toBe(isEndDate);
				expect(getEventType(rule)).toBe(eventType);
			},
		);
	});

	describe("calculateInstancesPerMonth", () => {
		it.each([
			["DAILY", 1, 30],
			["DAILY", 2, 15],
			["WEEKLY", 1, 4.33],
			["WEEKLY", 2, 2.165],
			["MONTHLY", 1, 1],
			["MONTHLY", 3, 0.33],
			["YEARLY", 1, 0.083],
			["YEARLY", 2, 0.041],
		] as const)(
			"should calculate instances per month for %s frequency with interval %i",
			(frequency, interval, expected) => {
				expect(calculateInstancesPerMonth(frequency, interval)).toBeCloseTo(
					expected,
					2,
				);
			},
		);
	});

	describe("validateRecurrenceRule", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			organizationId: "1",
			creatorId: "1",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: null,
			latestInstanceDate: new Date(),
			frequency: "DAILY",
			interval: 1,
			count: null,
			recurrenceStartDate: new Date("2025-01-01T00:00:00.000Z"),
			recurrenceEndDate: new Date("2025-01-10T00:00:00.000Z"),
			recurrenceRuleString: "RRULE:FREQ=DAILY;UNTIL=20250110T000000Z",
			byDay: null,
			byMonth: null,
			byMonthDay: null,
		};

		it.each([
			[baseRule, true, []],
			[{ ...baseRule, frequency: null }, false, ["Frequency is required"]],
			[{ ...baseRule, interval: 0 }, false, ["Interval must be at least 1"]],
			[{ ...baseRule, count: 0 }, false, ["Count must be at least 1"]],
			[
				{
					...baseRule,
					recurrenceEndDate: new Date("2024-01-01T00:00:00.000Z"),
				},
				false,
				["End date must be after start date"],
			],
		])("should validate various recurrence rules", (rule, isValid, errors) => {
			// biome-ignore lint/suspicious/noExplicitAny: This is a test case for invalid data
			const result = validateRecurrenceRule(rule as any);
			expect(result.isValid).toBe(isValid);
			expect(result.errors).toEqual(errors);
		});
	});
});
