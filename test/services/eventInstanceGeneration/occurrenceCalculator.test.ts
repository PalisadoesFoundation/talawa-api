import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import {
	calculateInstanceOccurrences,
	getNextOccurrenceDate,
	shouldGenerateInstanceAtDate,
	validateRecurrenceRule,
} from "~/src/services/eventGeneration/occurrenceCalculator";
import type {
	OccurrenceCalculationConfig,
	ServiceDependencies,
} from "~/src/services/eventGeneration/types";

afterEach(() => {
	vi.clearAllMocks();
});

suite("occurrenceCalculator", () => {
	const mockLogger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	} as unknown as ServiceDependencies["logger"];

	const mockBaseEvent = {
		id: faker.string.uuid(),
		name: "Test Event",
		startAt: new Date("2025-01-01T10:00:00Z"),
		endAt: new Date("2025-01-01T11:00:00Z"),
		organizationId: faker.string.uuid(),
	} as typeof eventsTable.$inferSelect;

	const mockRecurrenceRule = {
		id: faker.string.uuid(),
		baseRecurringEventId: mockBaseEvent.id,
		frequency: "WEEKLY",
		interval: 1,
		count: 4,
		recurrenceEndDate: null,
		byDay: null,
		byMonth: null,
		byMonthDay: null,
	} as typeof recurrenceRulesTable.$inferSelect;

	suite("calculateInstanceOccurrences", () => {
		// FIXED: For weekly recurrence with count=4, starting from 2025-01-01 (Wednesday)
		// Should generate: Jan 1, Jan 8, Jan 15, Jan 22 (4 occurrences)
		test("calculates occurrences for a weekly recurring event", () => {
			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			// With count=4, should generate exactly 4 occurrences
			expect(result).toHaveLength(4);
			expect(result[0]).toMatchObject({
				originalStartTime: new Date("2025-01-01T10:00:00Z"),
				actualStartTime: new Date("2025-01-01T10:00:00Z"),
				actualEndTime: new Date("2025-01-01T11:00:00Z"),
				isCancelled: false,
				sequenceNumber: 1,
				totalCount: 4,
			});
		});

		test("returns empty array when base event has no start or end time", () => {
			const eventWithoutTime = {
				...mockBaseEvent,
				startAt: null,
				endAt: null,
			} as unknown as typeof eventsTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: eventWithoutTime,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result).toHaveLength(0);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					baseEventId: eventWithoutTime.id,
					startAt: null,
					endAt: null,
				}),
				"Base event missing start or end time",
			);
		});

		test("applies exceptions to cancel an occurrence", () => {
			const canceledException = {
				id: faker.string.uuid(),
				recurringEventInstanceId: faker.string.uuid(),
				baseRecurringEventId: mockBaseEvent.id,
				exceptionData: {
					isCancelled: true,
					originalInstanceStartTime: new Date(
						"2025-01-08T10:00:00Z",
					).toISOString(),
				},
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as typeof eventExceptionsTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [canceledException],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			// FIXED: With count=4, should still generate exactly 4 occurrences (count limit)
			expect(result).toHaveLength(4);
			const cancelledOccurrence = result.find(
				(r) =>
					r.originalStartTime.getTime() ===
					new Date("2025-01-08T10:00:00Z").getTime(),
			);
			expect(cancelledOccurrence).toBeDefined();
			expect(cancelledOccurrence?.isCancelled).toBe(true);
		});

		test("applies exceptions to modify occurrence times", () => {
			const modifiedException = {
				id: faker.string.uuid(),
				recurringEventInstanceId: faker.string.uuid(),
				baseRecurringEventId: mockBaseEvent.id,
				exceptionData: {
					startAt: new Date("2025-01-08T14:00:00Z"),
					endAt: new Date("2025-01-08T15:00:00Z"),
					originalInstanceStartTime: new Date(
						"2025-01-08T10:00:00Z",
					).toISOString(),
				},
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as typeof eventExceptionsTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [modifiedException],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result).toHaveLength(4);
			const modifiedOccurrence = result.find(
				(r) =>
					r.originalStartTime.getTime() ===
					new Date("2025-01-08T10:00:00Z").getTime(),
			);
			expect(modifiedOccurrence).toBeDefined();
			expect(modifiedOccurrence?.actualStartTime).toEqual(
				new Date("2025-01-08T14:00:00Z"),
			);
			expect(modifiedOccurrence?.actualEndTime).toEqual(
				new Date("2025-01-08T15:00:00Z"),
			);
		});

		test("handles never-ending recurrence rules", () => {
			const neverEndingRule = {
				...mockRecurrenceRule,
				count: null,
				recurrenceEndDate: null,
			};

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: neverEndingRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result.length).toBeGreaterThan(0);
			expect(result.length).toBeLessThan(10); // Should be limited by window
		});

		test("handles recurrence rules with shouldCalculateTotalCount", () => {
			const endDateRule = {
				...mockRecurrenceRule,
				count: null, // No count specified
				recurrenceEndDate: new Date("2025-01-31T23:59:59Z"), // Has end date
			};

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: endDateRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result.length).toBeGreaterThan(0);
			// All occurrences should have their totalCount set to the final count
			for (const occurrence of result) {
				expect(occurrence.totalCount).toBe(result.length);
			}
		});

		test("handles occurrences that fall outside the window but still processes them", () => {
			const baseEventBefore = {
				...mockBaseEvent,
				startAt: new Date("2024-12-25T10:00:00Z"), // Before window
				endAt: new Date("2024-12-25T11:00:00Z"),
			};

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: {
					...mockRecurrenceRule,
					count: 10,
				},
				baseEvent: baseEventBefore,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			// Should only include occurrences that fall within the window
			expect(result.length).toBeGreaterThan(0);
			for (const occurrence of result) {
				expect(occurrence.originalStartTime.getTime()).toBeGreaterThanOrEqual(
					config.windowStart.getTime(),
				);
				expect(occurrence.originalStartTime.getTime()).toBeLessThanOrEqual(
					config.windowEnd.getTime(),
				);
			}
		});

		test("handles recurrence rules with end date", () => {
			const endDateRule = {
				...mockRecurrenceRule,
				count: null,
				recurrenceEndDate: new Date("2025-01-15T23:59:59Z"),
			};

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: endDateRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result.length).toBeGreaterThan(0);
			if (endDateRule.recurrenceEndDate) {
				expect(
					result.every(
						(r) => r.originalStartTime <= endDateRule.recurrenceEndDate,
					),
				).toBe(true);
			}
		});

		test("logs debug information during calculation", () => {
			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			calculateInstanceOccurrences(config, mockLogger);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					baseEventStart: mockBaseEvent.startAt?.toISOString(),
					windowStart: config.windowStart.toISOString(),
					windowEnd: config.windowEnd.toISOString(),
					frequency: mockRecurrenceRule.frequency,
					interval: mockRecurrenceRule.interval,
				}),
				"Starting occurrence calculation",
			);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					occurrencesGenerated: 4,
					totalCount: 4,
				}),
				"Occurrence calculation completed",
			);
		});
	});

	suite("shouldGenerateInstanceAtDate", () => {
		test("returns true for dates within recurrence period", () => {
			const date = new Date("2025-01-08T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			const result = shouldGenerateInstanceAtDate(
				date,
				mockRecurrenceRule,
				startDate,
			);

			expect(result).toBe(true);
		});

		test("returns false for dates before start date", () => {
			const date = new Date("2024-12-31T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			const result = shouldGenerateInstanceAtDate(
				date,
				mockRecurrenceRule,
				startDate,
			);

			expect(result).toBe(false);
		});

		test("returns false for dates after end date", () => {
			const endDateRule = {
				...mockRecurrenceRule,
				recurrenceEndDate: new Date("2025-01-15T23:59:59Z"),
			};
			const date = new Date("2025-01-16T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			const result = shouldGenerateInstanceAtDate(date, endDateRule, startDate);

			expect(result).toBe(false);
		});

		test("handles weekly recurrence with byDay filter", () => {
			const weeklyRule = {
				...mockRecurrenceRule,
				frequency: "WEEKLY",
				byDay: ["MO", "WE", "FR"],
			} as typeof recurrenceRulesTable.$inferSelect;

			const monday = new Date("2025-01-06T10:00:00Z"); // Monday
			const tuesday = new Date("2025-01-07T10:00:00Z"); // Tuesday
			const wednesday = new Date("2025-01-08T10:00:00Z"); // Wednesday
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(shouldGenerateInstanceAtDate(monday, weeklyRule, startDate)).toBe(
				true,
			);
			expect(shouldGenerateInstanceAtDate(tuesday, weeklyRule, startDate)).toBe(
				false,
			);
			expect(
				shouldGenerateInstanceAtDate(wednesday, weeklyRule, startDate),
			).toBe(true);
		});

		test("handles monthly recurrence with byMonthDay filter", () => {
			const monthlyRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				byMonthDay: [1, 15],
			} as typeof recurrenceRulesTable.$inferSelect;

			const firstDay = new Date("2025-01-01T10:00:00Z");
			const fifteenthDay = new Date("2025-01-15T10:00:00Z");
			const tenthDay = new Date("2025-01-10T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(
				shouldGenerateInstanceAtDate(firstDay, monthlyRule, startDate),
			).toBe(true);
			expect(
				shouldGenerateInstanceAtDate(fifteenthDay, monthlyRule, startDate),
			).toBe(true);
			expect(
				shouldGenerateInstanceAtDate(tenthDay, monthlyRule, startDate),
			).toBe(false);
		});

		test("handles yearly recurrence with byMonth filter", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				byMonth: [1, 6, 12],
			} as typeof recurrenceRulesTable.$inferSelect;

			const januaryDate = new Date("2025-01-01T10:00:00Z");
			const juneDate = new Date("2025-06-01T10:00:00Z");
			const marchDate = new Date("2025-03-01T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(
				shouldGenerateInstanceAtDate(januaryDate, yearlyRule, startDate),
			).toBe(true);
			expect(
				shouldGenerateInstanceAtDate(juneDate, yearlyRule, startDate),
			).toBe(true);
			expect(
				shouldGenerateInstanceAtDate(marchDate, yearlyRule, startDate),
			).toBe(false);
		});

		test("handles monthly recurrence with byDay filter (first Friday pattern)", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				byDay: ["1FR"], // First Friday of each month
			} as typeof recurrenceRulesTable.$inferSelect;

			const firstFriday = new Date("2025-01-03T10:00:00Z"); // First Friday in January 2025
			const secondFriday = new Date("2025-01-10T10:00:00Z"); // Second Friday in January 2025
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(
				shouldGenerateInstanceAtDate(firstFriday, monthlyByDayRule, startDate),
			).toBe(true);
			expect(
				shouldGenerateInstanceAtDate(secondFriday, monthlyByDayRule, startDate),
			).toBe(false);
		});

		test("handles monthly recurrence with byDay filter (second Tuesday pattern)", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				byDay: ["2TU"], // Second Tuesday of each month
			} as typeof recurrenceRulesTable.$inferSelect;

			const firstTuesday = new Date("2025-01-07T10:00:00Z"); // First Tuesday in January 2025
			const secondTuesday = new Date("2025-01-14T10:00:00Z"); // Second Tuesday in January 2025
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(
				shouldGenerateInstanceAtDate(firstTuesday, monthlyByDayRule, startDate),
			).toBe(false);
			expect(
				shouldGenerateInstanceAtDate(
					secondTuesday,
					monthlyByDayRule,
					startDate,
				),
			).toBe(true);
		});

		test("handles monthly recurrence with byDay filter where no match is found", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				byDay: ["1FR"], // First Friday of each month
			} as typeof recurrenceRulesTable.$inferSelect;

			const mondayDate = new Date("2025-01-06T10:00:00Z"); // Monday, not Friday
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(
				shouldGenerateInstanceAtDate(mondayDate, monthlyByDayRule, startDate),
			).toBe(false);
		});

		test("handles yearly recurrence with byMonthDay filter", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				byMonth: [1, 6, 12],
				byMonthDay: [1, 15],
			} as typeof recurrenceRulesTable.$inferSelect;

			const validDate = new Date("2025-01-15T10:00:00Z"); // January 15th
			const invalidDate = new Date("2025-01-10T10:00:00Z"); // January 10th (not in byMonthDay)
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(
				shouldGenerateInstanceAtDate(validDate, yearlyRule, startDate),
			).toBe(true);
			expect(
				shouldGenerateInstanceAtDate(invalidDate, yearlyRule, startDate),
			).toBe(false);
		});

		test("handles default case for unknown frequency", () => {
			const unknownFrequencyRule = {
				...mockRecurrenceRule,
				frequency: "UNKNOWN" as "DAILY",
			} as typeof recurrenceRulesTable.$inferSelect;

			const date = new Date("2025-01-08T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			expect(
				shouldGenerateInstanceAtDate(date, unknownFrequencyRule, startDate),
			).toBe(true);
		});
	});

	suite("getNextOccurrenceDate", () => {
		test("advances by interval for daily frequency", () => {
			const dailyRule = {
				...mockRecurrenceRule,
				frequency: "DAILY",
				interval: 2,
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-01T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, dailyRule);

			expect(nextDate).toEqual(new Date("2025-01-03T10:00:00Z"));
		});

		test("advances by weeks for weekly frequency", () => {
			const weeklyRule = {
				...mockRecurrenceRule,
				frequency: "WEEKLY",
				interval: 2,
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-01T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, weeklyRule);

			expect(nextDate).toEqual(new Date("2025-01-15T10:00:00Z"));
		});

		test("advances by months for monthly frequency", () => {
			const monthlyRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				interval: 2,
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-01T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, monthlyRule);

			expect(nextDate).toEqual(new Date("2025-03-01T10:00:00Z"));
		});

		test("advances by years for yearly frequency", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				interval: 2,
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-01T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, yearlyRule);

			expect(nextDate).toEqual(new Date("2027-01-01T10:00:00Z"));
		});

		test("defaults to daily advancement for unknown frequency", () => {
			const unknownRule = {
				...mockRecurrenceRule,
				frequency: "UNKNOWN" as "DAILY",
				interval: 3,
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-01T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, unknownRule);

			expect(nextDate).toEqual(new Date("2025-01-04T10:00:00Z"));
		});

		test("handles complex monthly byDay patterns", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				interval: 1,
				byDay: ["1FR"], // First Friday of each month
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-03T10:00:00Z"); // First Friday in January
			const nextDate = getNextOccurrenceDate(currentDate, monthlyByDayRule);

			// Should advance to February and calculate first Friday
			expect(nextDate.getUTCMonth()).toBe(1);
			expect(nextDate.getUTCDay()).toBe(5);
		});

		test("handles monthly recurrence without byDay patterns", () => {
			const monthlyRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				interval: 1,
				byDay: null, // No byDay pattern
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-15T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, monthlyRule);

			// Should advance to February 15th
			expect(nextDate).toEqual(new Date("2025-02-15T10:00:00Z"));
		});

		test("handles monthly byDay pattern with complex ordinal calculation", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				interval: 1,
				byDay: ["2WE"], // Second Wednesday of each month
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-08T10:00:00Z"); // Second Wednesday in January
			const nextDate = getNextOccurrenceDate(currentDate, monthlyByDayRule);

			// Should advance to February and calculate second Wednesday
			expect(nextDate.getUTCMonth()).toBe(1);
			expect(nextDate.getUTCDay()).toBe(3); // Wednesday
			expect(nextDate.getUTCDate()).toBe(12); // Second Wednesday of February 2025
		});
	});

	suite("validateRecurrenceRule", () => {
		test("returns true for valid recurrence rule", () => {
			const result = validateRecurrenceRule(mockRecurrenceRule);

			expect(result).toBe(true);
		});

		test("returns false for rule without frequency", () => {
			const invalidRule = {
				...mockRecurrenceRule,
				frequency: null as unknown as "DAILY",
			} as typeof recurrenceRulesTable.$inferSelect;

			const result = validateRecurrenceRule(invalidRule);

			expect(result).toBe(false);
		});

		test("returns false for rule with invalid frequency", () => {
			const invalidRule = {
				...mockRecurrenceRule,
				frequency: "INVALID" as "DAILY",
			} as typeof recurrenceRulesTable.$inferSelect;

			const result = validateRecurrenceRule(invalidRule);

			expect(result).toBe(false);
		});

		test("returns false for rule with negative interval", () => {
			const ruleWithNegativeInterval = {
				...mockRecurrenceRule,
				interval: -1,
			} as typeof recurrenceRulesTable.$inferSelect;

			const result = validateRecurrenceRule(ruleWithNegativeInterval);

			expect(result).toBe(false);
		});

		test("returns true for rule with interval 0 (falsy values are not validated)", () => {
			const ruleWithZeroInterval = {
				...mockRecurrenceRule,
				interval: 0,
			} as typeof recurrenceRulesTable.$inferSelect;

			const result = validateRecurrenceRule(ruleWithZeroInterval);

			expect(result).toBe(true);
		});

		test("returns true for rule with valid frequency options", () => {
			const validFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

			for (const frequency of validFrequencies) {
				const rule = {
					...mockRecurrenceRule,
					frequency,
				} as typeof recurrenceRulesTable.$inferSelect;

				expect(validateRecurrenceRule(rule)).toBe(true);
			}
		});

		test("returns true for rule with no interval (defaults to 1)", () => {
			const rule = {
				...mockRecurrenceRule,
				interval: null as unknown as number,
			} as typeof recurrenceRulesTable.$inferSelect;

			const result = validateRecurrenceRule(rule);

			expect(result).toBe(true);
		});
	});

	suite("yearly frequency handling", () => {
		test("handles yearly events without windowing", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				interval: 1,
				count: 3,
				recurrenceEndDate: null,
			} as typeof recurrenceRulesTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: yearlyRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2027-12-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result).toHaveLength(3);
			expect(result[0]?.originalStartTime).toEqual(
				new Date("2025-01-01T10:00:00Z"),
			);
			expect(result[1]?.originalStartTime).toEqual(
				new Date("2026-01-01T10:00:00Z"),
			);
			expect(result[2]?.originalStartTime).toEqual(
				new Date("2027-01-01T10:00:00Z"),
			);
		});

		test("handles yearly events with end date", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				interval: 1,
				count: null,
				recurrenceEndDate: new Date("2026-12-31T23:59:59Z"),
			} as typeof recurrenceRulesTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: yearlyRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2027-12-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result).toHaveLength(2); // 2025 and 2026 only
			expect(result[0]?.originalStartTime).toEqual(
				new Date("2025-01-01T10:00:00Z"),
			);
			expect(result[1]?.originalStartTime).toEqual(
				new Date("2026-01-01T10:00:00Z"),
			);
		});
	});

	suite("direct function coverage", () => {
		test("shouldGenerateForDaily returns true for all dates", () => {
			const dailyRule = {
				...mockRecurrenceRule,
				frequency: "DAILY",
			} as typeof recurrenceRulesTable.$inferSelect;

			const date = new Date("2025-01-15T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			const result = shouldGenerateInstanceAtDate(date, dailyRule, startDate);

			expect(result).toBe(true);
		});
	});

	suite("getNextOccurrenceDate edge cases", () => {
		test("handles weekly with byDay filter - day by day progression", () => {
			const weeklyByDayRule = {
				...mockRecurrenceRule,
				frequency: "WEEKLY",
				interval: 1,
				byDay: ["MO", "WE", "FR"],
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-06T10:00:00Z"); // Monday
			const nextDate = getNextOccurrenceDate(currentDate, weeklyByDayRule);

			// Should move to next day (Tuesday) for day-by-day checking
			expect(nextDate).toEqual(new Date("2025-01-07T10:00:00Z"));
		});

		test("handles monthly with byMonthDay and month transitions", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				interval: 2,
				byMonthDay: [15, 30],
			} as typeof recurrenceRulesTable.$inferSelect;

			// Start at end of January (31st) - next day will cross month boundary
			const currentDate = new Date("2025-01-31T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, monthlyByDayRule);

			// Should go to Feb 1st first, detect month boundary crossing,
			// then apply 2-month interval to get to March 1st
			expect(nextDate.getUTCMonth()).toBe(2); // March (0-indexed)
			expect(nextDate.getUTCDate()).toBe(1);
		});

		test("handles monthly with byMonthDay staying in same month", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				interval: 1,
				byMonthDay: [15, 30],
			} as typeof recurrenceRulesTable.$inferSelect;

			// Start at January 15th
			const currentDate = new Date("2025-01-15T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, monthlyByDayRule);

			// Should move to next day (January 16th) since we're still in January
			expect(nextDate).toEqual(new Date("2025-01-16T10:00:00Z"));
		});

		test("handles yearly with byMonth filter - month by month progression", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				interval: 1,
				byMonth: [1, 6, 12],
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-01T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, yearlyRule);

			// Should move to next month for month-by-month checking
			expect(nextDate).toEqual(new Date("2025-02-01T10:00:00Z"));
		});

		test("handles yearly with byMonthDay filter - month by month progression", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				interval: 1,
				byMonthDay: [1, 15],
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-15T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, yearlyRule);

			// Should move to next month for month-by-month checking
			expect(nextDate).toEqual(new Date("2025-02-15T10:00:00Z"));
		});

		test("handles yearly without byMonth or byMonthDay - year progression", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				interval: 2,
				byMonth: null,
				byMonthDay: null,
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-15T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, yearlyRule);

			// Should move by full years
			expect(nextDate).toEqual(new Date("2027-01-15T10:00:00Z"));
		});
	});

	suite("additional edge cases", () => {
		test("handles weekly recurrence with empty byDay array", () => {
			const weeklyRule = {
				...mockRecurrenceRule,
				frequency: "WEEKLY",
				byDay: [],
			} as typeof recurrenceRulesTable.$inferSelect;

			const date = new Date("2025-01-08T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			// Should return true when byDay is empty
			expect(shouldGenerateInstanceAtDate(date, weeklyRule, startDate)).toBe(
				true,
			);
		});

		test("handles monthly recurrence with empty byDay array", () => {
			const monthlyRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				byDay: [],
			} as typeof recurrenceRulesTable.$inferSelect;

			const date = new Date("2025-01-15T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			// Should return true when byDay is empty
			expect(shouldGenerateInstanceAtDate(date, monthlyRule, startDate)).toBe(
				true,
			);
		});

		test("handles monthly recurrence with empty byMonthDay array", () => {
			const monthlyRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				byMonthDay: [],
			} as typeof recurrenceRulesTable.$inferSelect;

			const date = new Date("2025-01-15T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			// Should return true when byMonthDay is empty
			expect(shouldGenerateInstanceAtDate(date, monthlyRule, startDate)).toBe(
				true,
			);
		});

		test("handles yearly recurrence with empty byMonth array", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				byMonth: [],
			} as typeof recurrenceRulesTable.$inferSelect;

			const date = new Date("2025-06-15T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			// Should return true when byMonth is empty
			expect(shouldGenerateInstanceAtDate(date, yearlyRule, startDate)).toBe(
				true,
			);
		});

		test("handles yearly recurrence with empty byMonthDay array", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				byMonthDay: [],
			} as typeof recurrenceRulesTable.$inferSelect;

			const date = new Date("2025-06-15T10:00:00Z");
			const startDate = new Date("2025-01-01T10:00:00Z");

			// Should return true when byMonthDay is empty
			expect(shouldGenerateInstanceAtDate(date, yearlyRule, startDate)).toBe(
				true,
			);
		});

		test("handles exceptions without originalInstanceStartTime in exceptionData", () => {
			const exceptionWithoutTime = {
				id: faker.string.uuid(),
				recurringEventInstanceId: faker.string.uuid(),
				baseRecurringEventId: mockBaseEvent.id,
				exceptionData: {
					// Missing originalInstanceStartTime
					isCancelled: true,
				},
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as typeof eventExceptionsTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: mockBaseEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [exceptionWithoutTime],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			// Should return exact expected number of occurrences
			expect(result.length).toBe(4);
			// Should ensure none of the returned occurrences have recurringEventInstanceId equal to exceptionWithoutTime.recurringEventInstanceId
			expect(
				result.every(
					(occurrence) =>
						occurrence.recurringEventInstanceId !==
						exceptionWithoutTime.recurringEventInstanceId,
				),
			).toBe(true);
		});

		test("handles monthly byDay with missing byDay rule", () => {
			const monthlyByDayRule = {
				...mockRecurrenceRule,
				frequency: "MONTHLY",
				interval: 1,
				byDay: [""],
			} as typeof recurrenceRulesTable.$inferSelect;

			const currentDate = new Date("2025-01-01T10:00:00Z");
			const nextDate = getNextOccurrenceDate(currentDate, monthlyByDayRule);

			// Should handle gracefully and move to next month
			expect(nextDate.getUTCMonth()).toBe(1);
		});

		test("handles yearly events with conditions that don't generate instances", () => {
			const yearlyRule = {
				...mockRecurrenceRule,
				frequency: "YEARLY",
				interval: 1,
				count: 3,
				byMonth: [6], // Only June
			} as typeof recurrenceRulesTable.$inferSelect;

			const juneEvent = {
				...mockBaseEvent,
				startAt: new Date("2025-06-01T10:00:00Z"), // June event matches June rule
				endAt: new Date("2025-06-01T11:00:00Z"),
			} as typeof eventsTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: yearlyRule,
				baseEvent: juneEvent,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2027-12-31T23:59:59Z"),
				exceptions: [],
			};

			const result = calculateInstanceOccurrences(config, mockLogger);

			// Should generate 3 occurrences since June 1st matches byMonth: [6]
			expect(result).toHaveLength(3);
		});

		test("handles event duration calculation with null endAt", () => {
			const eventWithNullEnd = {
				...mockBaseEvent,
				startAt: new Date("2025-01-01T10:00:00Z"),
				endAt: null,
			} as unknown as typeof eventsTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: eventWithNullEnd,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			// Should handle gracefully - the buildRecurrenceContext function should cope with null endAt
			const result = calculateInstanceOccurrences(config, mockLogger);

			expect(result).toHaveLength(0);
		});

		test("handles event duration calculation with null startAt", () => {
			const eventWithNullStart = {
				...mockBaseEvent,
				startAt: null,
				endAt: new Date("2025-01-01T11:00:00Z"),
			} as unknown as typeof eventsTable.$inferSelect;

			const config: OccurrenceCalculationConfig = {
				recurrenceRule: mockRecurrenceRule,
				baseEvent: eventWithNullStart,
				windowStart: new Date("2025-01-01T00:00:00Z"),
				windowEnd: new Date("2025-01-31T23:59:59Z"),
				exceptions: [],
			};

			// Should return empty array due to missing startAt
			const result = calculateInstanceOccurrences(config, mockLogger);
			expect(result).toHaveLength(0);
		});
	});
});
