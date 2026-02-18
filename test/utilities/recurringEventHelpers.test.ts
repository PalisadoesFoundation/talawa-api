import { describe, expect, it } from "vitest";
import type { z } from "zod";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { recurrenceInputSchema } from "~/src/graphql/inputs/RecurrenceInput";
import {
	applyRecurrenceOverrides,
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
} from "~/src/utilities/recurringEvent";

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
		])("should build the correct RRULE string for various inputs", (recurrence, expected) => {
			const rrule = buildRRuleString(
				recurrence as z.infer<typeof recurrenceInputSchema>,
				startDate,
			);
			expect(rrule).toBe(expected);
		});
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
			// Test valid ordinal prefixes in byDay (for MONTHLY/YEARLY)
			[
				{
					frequency: "MONTHLY",
					byDay: ["1MO", "-1SU", "2WE"],
					never: true,
				},
				true,
				[],
			],
			// Test invalid ordinal prefix - bad day code
			[
				{
					frequency: "MONTHLY",
					byDay: ["1XX"],
					never: true,
				},
				false,
				["Invalid day code: 1XX"],
			],
			// Test YEARLY never-ending validation
			[
				{
					frequency: "YEARLY",
					never: true,
				},
				false,
				[
					"Yearly events cannot be never-ending. Please specify an end date or count.",
				],
			],
			// Test invalid interval (< 1)
			[
				{
					frequency: "DAILY",
					interval: 0,
					never: true,
				},
				false,
				["Recurrence interval must be at least 1"],
			],
		])("should validate various recurrence inputs", (recurrence, isValid, errors) => {
			const result = validateRecurrenceInput(
				recurrence as z.infer<typeof recurrenceInputSchema>,
				startDate,
			);
			expect(result.isValid).toBe(isValid);
			expect(result.errors).toEqual(errors);
		});
	});

	describe("normalizeRecurrenceRule", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			originalSeriesId: "1",
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

		// Test input validation
		it("should throw error for invalid count (negative)", () => {
			const invalidRule = {
				...baseRule,
				count: -5,
			};
			expect(() => normalizeRecurrenceRule(invalidRule)).toThrow(
				"Invalid recurrence count",
			);
		});

		it("should throw error for invalid count (non-integer)", () => {
			const invalidRule = {
				...baseRule,
				count: 5.5,
			};
			expect(() => normalizeRecurrenceRule(invalidRule)).toThrow(
				"Invalid recurrence count",
			);
		});

		it("should throw error for invalid interval (zero)", () => {
			const invalidRule = {
				...baseRule,
				count: 5,
				interval: 0,
			};
			expect(() => normalizeRecurrenceRule(invalidRule)).toThrow(
				"Invalid recurrence interval",
			);
		});

		it("should throw error for invalid start date", () => {
			const invalidRule = {
				...baseRule,
				count: 5,
				recurrenceStartDate: new Date("invalid"),
			};
			expect(() => normalizeRecurrenceRule(invalidRule)).toThrow(
				"Invalid recurrence start date",
			);
		});
	});

	describe("calculateCompletionDateFromCount", () => {
		const startDate = new Date("2025-01-01T00:00:00.000Z");
		it.each([
			[10, "DAILY", 1, new Date("2025-01-10T00:00:00.000Z")],
			[5, "WEEKLY", 2, new Date("2025-02-26T00:00:00.000Z")],
			[6, "MONTHLY", 1, new Date("2025-06-01T00:00:00.000Z")],
			[3, "YEARLY", 1, new Date("2027-01-01T00:00:00.000Z")],
			// Unknown frequency - defaults to daily calculation (covers line 46)
			[10, "UNKNOWN", 1, new Date("2025-01-10T00:00:00.000Z")],
		] as const)("should calculate the correct completion date", (count, frequency, interval, expected) => {
			const completionDate = calculateCompletionDateFromCount(
				startDate,
				count,
				frequency,
				interval,
			);
			expect(completionDate).toEqual(expected);
		});
	});

	describe("estimateInstanceCount", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			originalSeriesId: "1",
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
				undefined,
			],
			// YEARLY never-ending - covers line 103
			[
				{
					...baseRule,
					frequency: "YEARLY",
					recurrenceRuleString: "RRULE:FREQ=YEARLY",
				},
				1,
				undefined,
			],
			// Unknown frequency default case - covers line 105
			[
				{
					...baseRule,
					frequency: "UNKNOWN",
					recurrenceRuleString: "RRULE:FREQ=UNKNOWN",
				},
				360,
				undefined,
			],
			// MONTHLY with end date - covers line 83
			[
				{
					...baseRule,
					frequency: "MONTHLY",
					recurrenceEndDate: new Date("2026-01-01T00:00:00.000Z"),
					recurrenceRuleString: "RRULE:FREQ=MONTHLY;UNTIL=20260101T000000Z",
				},
				13,
				undefined,
			],
			// YEARLY with end date - covers line 85
			[
				{
					...baseRule,
					frequency: "YEARLY",
					recurrenceEndDate: new Date("2027-01-01T00:00:00.000Z"),
					recurrenceRuleString: "RRULE:FREQ=YEARLY;UNTIL=20270101T000000Z",
				},
				2,
				undefined,
			],
			// DAILY never-ending - covers line 97
			[
				{
					...baseRule,
					frequency: "DAILY",
					recurrenceRuleString: "RRULE:FREQ=DAILY",
				},
				360,
				undefined,
			],
			// WEEKLY never-ending - covers line 99
			[
				{
					...baseRule,
					frequency: "WEEKLY",
					recurrenceRuleString: "RRULE:FREQ=WEEKLY",
				},
				52,
				undefined,
			],
			// WEEKLY with end date - covers line 81
			[
				{
					...baseRule,
					frequency: "WEEKLY",
					recurrenceEndDate: new Date("2025-03-01T00:00:00.000Z"),
					recurrenceRuleString: "RRULE:FREQ=WEEKLY;UNTIL=20250301T000000Z",
				},
				9,
				undefined,
			],
			// Unknown frequency with end date - covers line 87
			[
				{
					...baseRule,
					frequency: "UNKNOWN",
					recurrenceEndDate: new Date("2025-01-31T00:00:00.000Z"),
					recurrenceRuleString: "RRULE:FREQ=UNKNOWN;UNTIL=20250131T000000Z",
				},
				30,
				undefined,
			],
		] as const)("should estimate the instance count", (rule, expected, estimationWindow) => {
			expect(
				estimateInstanceCount(
					rule as typeof recurrenceRulesTable.$inferSelect,
					estimationWindow,
				),
			).toBe(expected);
		});
	});

	describe("Event Type Functions", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			originalSeriesId: "1",
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
			// Edge case: count = 0 should be treated as no count (falsy)
			[{ ...baseRule, count: 0 }, true, false, false, "NEVER_ENDING"],
		] as const)("should correctly classify event types", (rule, isNever, isCount, isEndDate, eventType) => {
			expect(isNeverEndingEvent(rule)).toBe(isNever);
			expect(isCountBasedEvent(rule)).toBe(isCount);
			expect(isEndDateBasedEvent(rule)).toBe(isEndDate);
			expect(getEventType(rule)).toBe(eventType);
		});
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
		] as const)("should calculate instances per month for %s frequency with interval %i", (frequency, interval, expected) => {
			expect(calculateInstancesPerMonth(frequency, interval)).toBeCloseTo(
				expected,
				2,
			);
		});

		// Test invalid interval error - covers lines 124-125
		it("should throw RangeError for invalid interval", () => {
			expect(() => calculateInstancesPerMonth("DAILY", 0)).toThrow(
				"interval must be a positive number",
			);
			expect(() => calculateInstancesPerMonth("DAILY", -1)).toThrow(
				"interval must be a positive number",
			);
			expect(() => calculateInstancesPerMonth("DAILY", NaN)).toThrow(
				"interval must be a positive number",
			);
		});

		// Test unknown frequency default case - covers line 137
		it("should default to daily calculation for unknown frequency", () => {
			expect(calculateInstancesPerMonth("UNKNOWN", 1)).toBe(30);
		});
	});

	describe("validateRecurrenceRule", () => {
		const baseRule: typeof recurrenceRulesTable.$inferSelect = {
			id: "1",
			baseRecurringEventId: "1",
			originalSeriesId: "1",
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
			// Invalid frequency value
			[
				{ ...baseRule, frequency: "INVALID" },
				false,
				["Invalid frequency: INVALID"],
			],
			// Negative interval
			[{ ...baseRule, interval: -1 }, false, ["Interval must be at least 1"]],
			// Null/undefined interval (should pass)
			[{ ...baseRule, interval: null }, true, []],
			// Negative count
			[{ ...baseRule, count: -1 }, false, ["Count must be at least 1"]],
			// Null count (should pass)
			[{ ...baseRule, count: null }, true, []],
			// End date equal to start date (should fail with <=)
			[
				{
					...baseRule,
					recurrenceEndDate: new Date("2025-01-01T00:00:00.000Z"),
				},
				false,
				["End date must be after start date"],
			],
			// Null/undefined recurrenceEndDate (should pass)
			[{ ...baseRule, recurrenceEndDate: null }, true, []],
		])("should validate various recurrence rules", (rule, isValid, errors) => {
			const result = validateRecurrenceRule(
				rule as typeof recurrenceRulesTable.$inferSelect,
			);
			expect(result.isValid).toBe(isValid);
			expect(result.errors).toEqual(errors);
		});
	});

	describe("applyRecurrenceOverrides", () => {
		const baseOriginalRecurrence = {
			frequency: "WEEKLY",
			interval: 1,
			recurrenceEndDate: new Date("2025-06-01T00:00:00.000Z"),
			count: null,
			byDay: ["MO"],
			byMonth: null,
			byMonthDay: null,
		} as Pick<
			typeof recurrenceRulesTable.$inferSelect,
			| "frequency"
			| "interval"
			| "recurrenceEndDate"
			| "count"
			| "byDay"
			| "byMonth"
			| "byMonthDay"
		>;

		describe("newStartAt parameter scenarios", () => {
			it("should derive byDay from newStartAt for WEEKLY frequency", () => {
				const newStartAt = new Date("2025-01-07T10:00:00.000Z"); // Tuesday
				const result = applyRecurrenceOverrides(
					newStartAt,
					baseOriginalRecurrence,
				);

				expect(result.byDay).toEqual(["TU"]);
				expect(result.frequency).toBe("WEEKLY");
			});

			it("should derive byDay from newStartAt for MONTHLY frequency when original had byDay", () => {
				const newStartAt = new Date("2025-01-08T10:00:00.000Z"); // Wednesday
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
					byDay: ["MO"],
				};
				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byDay).toEqual(["WE"]);
				expect(result.frequency).toBe("MONTHLY");
			});

			it("should derive byDay from newStartAt for MONTHLY frequency when original had no byMonthDay", () => {
				const newStartAt = new Date("2025-01-09T10:00:00.000Z"); // Thursday
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
					byDay: null,
					byMonthDay: null,
				};
				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byDay).toEqual(["TH"]);
			});

			it("should not override byDay for MONTHLY frequency when original had byMonthDay", () => {
				const newStartAt = new Date("2025-01-10T10:00:00.000Z"); // Friday
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
					byDay: null,
					byMonthDay: [15],
				};
				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byDay).toBeUndefined();
			});

			it("should update byMonthDay from newStartAt for MONTHLY frequency", () => {
				const newStartAt = new Date("2025-01-15T10:00:00.000Z"); // 15th day
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
					byMonthDay: [10],
				};
				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byMonthDay).toEqual([15]);
			});

			it("should update byMonth from newStartAt for YEARLY frequency", () => {
				const newStartAt = new Date("2025-03-15T10:00:00.000Z"); // March (month 3)
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "YEARLY" as const,
					byMonth: [6], // June
				};
				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byMonth).toEqual([3]);
			});

			it("should throw error for invalid day index", () => {
				// This test covers the error condition, though it's unlikely to happen in practice
				// We'll need to mock getDay() to return an invalid value
				const invalidDate = {
					getDay: () => -1,
					getDate: () => 15,
					getMonth: () => 2,
				} as unknown as Date;

				expect(() => {
					applyRecurrenceOverrides(invalidDate, baseOriginalRecurrence);
				}).toThrow("Invalid day of week derived from startAt");
			});

			it("should handle edge case when dayIndex is at boundary", () => {
				const sundayDate = new Date("2025-01-05T10:00:00.000Z"); // Sunday (day 0)
				const result = applyRecurrenceOverrides(
					sundayDate,
					baseOriginalRecurrence,
				);

				expect(result.byDay).toEqual(["SU"]);
			});

			it("should handle Saturday edge case", () => {
				const saturdayDate = new Date("2025-01-04T10:00:00.000Z"); // Saturday (day 6)
				const result = applyRecurrenceOverrides(
					saturdayDate,
					baseOriginalRecurrence,
				);

				expect(result.byDay).toEqual(["SA"]);
			});
		});

		describe("originalRecurrence parameter scenarios", () => {
			it("should use originalRecurrence when no inputRecurrence provided", () => {
				const originalRecurrence = {
					frequency: "DAILY" as const,
					interval: 2,
					recurrenceEndDate: new Date("2025-12-31T00:00:00.000Z"),
					count: 50,
					byDay: ["MO", "WE", "FR"],
					byMonth: [1, 6, 12],
					byMonthDay: [1, 15],
				};

				const result = applyRecurrenceOverrides(undefined, originalRecurrence);

				expect(result.frequency).toBe("DAILY");
				expect(result.interval).toBe(2);
				expect(result.endDate).toEqual(new Date("2025-12-31T00:00:00.000Z"));
				expect(result.count).toBe(50);
				expect(result.never).toBe(false);
				expect(result.byDay).toEqual(["MO", "WE", "FR"]);
				expect(result.byMonth).toEqual([1, 6, 12]);
				expect(result.byMonthDay).toEqual([1, 15]);
			});

			it("should set never=true when no endDate and no count", () => {
				const originalRecurrence = {
					frequency: "WEEKLY" as const,
					interval: 1,
					recurrenceEndDate: null,
					count: null,
					byDay: null,
					byMonth: null,
					byMonthDay: null,
				};

				const result = applyRecurrenceOverrides(undefined, originalRecurrence);

				expect(result.never).toBe(true);
				expect(result.endDate).toBeUndefined();
				expect(result.count).toBeUndefined();
			});

			it("should handle null/undefined values in originalRecurrence", () => {
				const originalRecurrence = {
					frequency: "MONTHLY" as const,
					interval: 1,
					recurrenceEndDate: null,
					count: null,
					byDay: null,
					byMonth: null,
					byMonthDay: null,
				};

				const result = applyRecurrenceOverrides(undefined, originalRecurrence);

				expect(result.byDay).toBeUndefined();
				expect(result.byMonth).toBeUndefined();
				expect(result.byMonthDay).toBeUndefined();
			});
		});

		describe("inputRecurrence override scenarios", () => {
			it("should use inputRecurrence when provided", () => {
				const inputRecurrence = {
					frequency: "DAILY",
					interval: 3,
					endDate: new Date("2025-12-25T00:00:00.000Z"),
					count: 25,
					never: false,
					byDay: ["TU", "TH"],
					byMonth: [3, 9],
					byMonthDay: [5, 20],
				} as z.infer<typeof recurrenceInputSchema>;

				const result = applyRecurrenceOverrides(
					undefined,
					baseOriginalRecurrence,
					inputRecurrence,
				);

				expect(result).toEqual(inputRecurrence);
			});

			it("should use inputRecurrence.byDay when startAt not provided", () => {
				const inputRecurrence = {
					frequency: "WEEKLY",
					interval: 1,
					never: true,
					byDay: ["FR", "SA"],
				} as z.infer<typeof recurrenceInputSchema>;

				const result = applyRecurrenceOverrides(
					undefined,
					baseOriginalRecurrence,
					inputRecurrence,
				);

				expect(result.byDay).toEqual(["FR", "SA"]);
			});

			it("should use inputRecurrence.byMonthDay when provided", () => {
				const inputRecurrence = {
					frequency: "MONTHLY",
					interval: 1,
					never: true,
					byMonthDay: [10, 25],
				} as z.infer<typeof recurrenceInputSchema>;

				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
				};

				const result = applyRecurrenceOverrides(
					new Date("2025-01-15T10:00:00.000Z"),
					originalRecurrence,
					inputRecurrence,
				);

				expect(result.byMonthDay).toEqual([10, 25]);
			});

			it("should use inputRecurrence.byMonth when provided", () => {
				const inputRecurrence = {
					frequency: "YEARLY",
					interval: 1,
					never: true,
					byMonth: [4, 8, 12],
				} as z.infer<typeof recurrenceInputSchema>;

				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "YEARLY" as const,
				};

				const result = applyRecurrenceOverrides(
					new Date("2025-03-15T10:00:00.000Z"),
					originalRecurrence,
					inputRecurrence,
				);

				expect(result.byMonth).toEqual([4, 8, 12]);
			});
		});

		describe("frequency-specific logic", () => {
			it("should handle WEEKLY frequency with newStartAt override", () => {
				const newStartAt = new Date("2025-01-03T10:00:00.000Z"); // Friday
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "WEEKLY" as const,
					byDay: ["MO", "WE"],
				};

				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byDay).toEqual(["FR"]);
			});

			it("should not override byMonthDay for MONTHLY when no original byMonthDay", () => {
				const newStartAt = new Date("2025-01-20T10:00:00.000Z");
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
					byMonthDay: null,
				};

				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byMonthDay).toBeUndefined();
			});

			it("should not override byMonth for YEARLY when no original byMonth", () => {
				const newStartAt = new Date("2025-05-15T10:00:00.000Z");
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "YEARLY" as const,
					byMonth: null,
				};

				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byMonth).toBeUndefined();
			});

			it("should not affect other frequency types", () => {
				const newStartAt = new Date("2025-01-15T10:00:00.000Z");
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "DAILY" as const,
				};

				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				// For DAILY, byDay should remain unchanged unless specifically overridden
				expect(result.byDay).toEqual(["MO"]);
			});
		});

		describe("complex scenarios", () => {
			it("should handle newStartAt with inputRecurrence overrides", () => {
				const newStartAt = new Date("2025-01-08T10:00:00.000Z"); // Wednesday
				const inputRecurrence = {
					frequency: "WEEKLY",
					interval: 2,
					count: 10,
					never: false,
				} as z.infer<typeof recurrenceInputSchema>;

				const result = applyRecurrenceOverrides(
					newStartAt,
					baseOriginalRecurrence,
					inputRecurrence,
				);

				// newStartAt should override byDay even with inputRecurrence provided
				expect(result.byDay).toEqual(["WE"]);
				expect(result.interval).toBe(2);
				expect(result.count).toBe(10);
			});

			it("should handle MONTHLY with both byDay and byMonthDay scenarios", () => {
				const newStartAt = new Date("2025-01-20T10:00:00.000Z"); // Monday, 20th
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
					byDay: ["WE"],
					byMonthDay: [15],
				};

				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				// Should update both byDay (because original had byDay) and byMonthDay (because original had byMonthDay)
				expect(result.byDay).toEqual(["MO"]);
				expect(result.byMonthDay).toEqual([20]);
			});

			it("should handle YEARLY with byMonth update", () => {
				const newStartAt = new Date("2025-07-04T10:00:00.000Z"); // July (month 7)
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "YEARLY" as const,
					byMonth: [1, 12],
				};

				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				expect(result.byMonth).toEqual([7]);
			});

			it("should handle empty arrays in original recurrence", () => {
				const newStartAt = new Date("2025-01-15T10:00:00.000Z");
				const originalRecurrence = {
					...baseOriginalRecurrence,
					frequency: "MONTHLY" as const,
					byDay: [],
					byMonthDay: [],
					byMonth: [],
				};

				const result = applyRecurrenceOverrides(newStartAt, originalRecurrence);

				// Empty arrays should be treated as having no data, but the array exists
				// So byDay won't be set because !originalRecurrence.byMonthDay is false (empty array is truthy)
				expect(result.byDay).toEqual([]); // Empty array from original
				expect(result.byMonthDay).toEqual([]); // Empty array from original
				expect(result.byMonth).toEqual([]); // Empty array from original
			});
		});
	});
});
