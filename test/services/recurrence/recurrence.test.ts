import { describe, expect, test } from "vitest";

import {
  addDays,
  addMonthSafely,
  addWeeks,
  daysInMonth,
  generateOccurrences,
  parseRRule,
  type RecurrenceRule,
  startOfWeek,
  type Weekday,
  weekOffset,
} from "~/src/services/recurrence/recurrence";

const TEMPLATE_START = new Date("2025-01-01T10:00:00Z");

describe("recurrence utilities", () => {
  describe("parseRRule", () => {
    test("parses common RRULE fields with sensible defaults", () => {
      const rule = parseRRule(
        "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=4;UNTIL=2025-02-01T00:00:00Z"
      );

      expect(rule).toMatchObject({
        freq: "WEEKLY",
        interval: 2,
        byDay: ["MO", "WE"],
        count: 4,
      });
      expect(rule.until?.toISOString()).toBe("2025-02-01T00:00:00.000Z");
    });

    test("throws when FREQ is invalid", () => {
      expect(() => parseRRule("FREQ=INVALID;INTERVAL=1")).toThrow(RangeError);
      expect(() => parseRRule("FREQ=YEARLY;INTERVAL=1")).toThrow(RangeError);
    });

    test("throws when FREQ is missing", () => {
      expect(() => parseRRule("INTERVAL=1")).toThrow(RangeError);
      expect(() => parseRRule("")).toThrow(
        new RangeError("RRULE missing FREQ")
      );
    });
    test("throws when BYDAY has invalid tokens", () => {
      expect(() => parseRRule("FREQ=WEEKLY;BYDAY=MO,XX,FR")).toThrow(
        RangeError
      );
    });

    test("parses BYDAY when tokens are valid", () => {
      const rule = parseRRule("FREQ=WEEKLY;BYDAY=mo,we,fr");
      expect(rule.byDay).toEqual(["MO", "WE", "FR"]);
    });

    test("parses compact UNTIL format", () => {
      const rule = parseRRule("FREQ=DAILY;UNTIL=20251231T235959Z");
      expect(rule.until?.toISOString()).toBe("2025-12-31T23:59:59.000Z");
    });

    test("throws when UNTIL is invalid", () => {
      expect(() => parseRRule("FREQ=DAILY;UNTIL=not-a-date")).toThrow(
        RangeError
      );
    });
  });

  describe("addDays", () => {
    test("advances the date forward by the requested number of days", () => {
      const nextDay = addDays(TEMPLATE_START, 1);
      expect(nextDay.toISOString()).toBe("2025-01-02T10:00:00.000Z");
    });

    test("supports negative intervals to move backwards in time", () => {
      const previousDay = addDays(TEMPLATE_START, -2);
      expect(previousDay.toISOString()).toBe("2024-12-30T10:00:00.000Z");
    });
  });

  describe("addWeeks", () => {
    test("moves the date forward by whole weeks", () => {
      const inTwoWeeks = addWeeks(TEMPLATE_START, 2);
      expect(inTwoWeeks.toISOString()).toBe("2025-01-15T10:00:00.000Z");
    });

    test("returns the same instant when adding zero weeks", () => {
      const unchanged = addWeeks(TEMPLATE_START, 0);
      expect(unchanged.toISOString()).toBe(TEMPLATE_START.toISOString());
    });

    test("handles negative weeks for backward navigation", () => {
      const priorWeek = addWeeks(TEMPLATE_START, -1);
      expect(priorWeek.toISOString()).toBe("2024-12-25T10:00:00.000Z");
    });
  });

  describe("startOfWeek", () => {
    test("returns prior Sunday for mid-week date", () => {
      const base = new Date("2025-01-08T10:00:00Z"); // Wednesday
      const start = startOfWeek(base);
      expect(start.toISOString()).toBe("2025-01-05T10:00:00.000Z");
    });

    test("returns same date when already Sunday", () => {
      const base = new Date("2025-01-05T10:00:00Z"); // Sunday
      const start = startOfWeek(base);
      expect(start.toISOString()).toBe("2025-01-05T10:00:00.000Z");
    });
  });

  describe("weekOffset", () => {
    test("maps weekday codes to numeric offsets", () => {
      expect(weekOffset.SU).toBe(0);
      expect(weekOffset.MO).toBe(1);
      expect(weekOffset.WE).toBe(3);
      expect(weekOffset.FR).toBe(5);
    });
  });
  describe("addMonthSafely", () => {
    test("keeps same day when target month supports it", () => {
      const base = new Date("2025-01-02T10:00:00Z");
      const result = addMonthSafely(base, 2);
      expect(result.toISOString()).toBe("2025-03-02T10:00:00.000Z");
    });

    test("clamps 31st across shorter months", () => {
      const base = new Date("2025-01-31T05:45:00Z");
      const result = addMonthSafely(base, 2);
      expect(result.toISOString()).toBe("2025-03-31T05:45:00.000Z");
    });

    test("leap year: Jan 29 -> Feb 29", () => {
      const base = new Date("2024-01-29T08:00:00Z");
      const result = addMonthSafely(base, 1);
      expect(result.toISOString()).toBe("2024-02-29T08:00:00.000Z");
    });

    test("non-leap year: Jan 29 -> Feb 28", () => {
      const base = new Date("2025-01-29T08:00:00Z");
      const result = addMonthSafely(base, 1);
      expect(result.toISOString()).toBe("2025-02-28T08:00:00.000Z");
    });

    test("supports long intervals like 13 months", () => {
      const base = new Date("2020-01-15T12:00:00Z");
      const result = addMonthSafely(base, 13);
      expect(result.toISOString()).toBe("2021-02-15T12:00:00.000Z");
    });
  });

  describe("daysInMonth", () => {
    describe("generates number of days in month", () => {
      test("month having 31 days", () => {
        const days = daysInMonth(2025, 2);
        expect(days).toBe(31);
      });
      test("month having 30 days", () => {
        const days = daysInMonth(2025, 3);
        expect(days).toBe(30);
      });
      test("days in feb in case of leap year", () => {
        const days = daysInMonth(2024, 1);
        expect(days).toBe(29);
      });
      test("days in feb in case of non leap year", () => {
        const days = daysInMonth(2025, 1);
        expect(days).toBe(28);
      });
      test("handles January lower bound (monthIdx 0)", () => {
        const days = daysInMonth(2025, 0);
        expect(days).toBe(31);
      });
      test("handles December upper bound (monthIdx 11)", () => {
        const days = daysInMonth(2025, 11);
        expect(days).toBe(31);
      });
      test("throws when month index is below 0", () => {
        expect(() => daysInMonth(2025, -1)).toThrow(RangeError);
      });
      test("throws when month index is above 11", () => {
        expect(() => daysInMonth(2025, 12)).toThrow(RangeError);
      });
    });
  });
  describe("generateOccurrences", () => {
    test("produces daily occurrences until window end when count is large", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z");
      const baseEnd = new Date("2025-01-01T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "DAILY",
        interval: 1,
        count: 10,
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-01-04T23:59:59Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences).toHaveLength(4);
      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-01T10:00:00.000Z",
        "2025-01-02T10:00:00.000Z",
        "2025-01-03T10:00:00.000Z",
        "2025-01-04T10:00:00.000Z",
      ]);
    });

    test("respects DAILY count limit once sequence reaches it", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z");
      const baseEnd = new Date("2025-01-01T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "DAILY",
        interval: 1,
        count: 2,
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-01-10T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences).toHaveLength(2);
      expect(occurrences.map((o) => o.seq)).toEqual([1, 2]);
    });

    test("skips daily occurrences that end before the window starts", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z");
      const baseEnd = new Date("2025-01-01T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "DAILY",
        interval: 1,
        count: 2,
      };
      const windowStart = new Date("2025-01-05T00:00:00Z");
      const windowEnd = new Date("2025-01-10T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences).toHaveLength(0);
    });

    test("returns no occurrences when UNTIL is before window start", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z");
      const baseEnd = new Date("2025-01-01T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "DAILY",
        interval: 1,
        count: 10,
        until: new Date("2025-01-02T00:00:00Z"),
      };
      const windowStart = new Date("2025-01-03T00:00:00Z");
      const windowEnd = new Date("2025-01-10T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences).toHaveLength(0);
    });

    test("includes multi-day events that overlap the window start", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z");
      const baseEnd = new Date("2025-01-03T10:00:00Z");
      const rule: RecurrenceRule = {
        freq: "DAILY",
        interval: 5,
        count: 1,
      };
      const windowStart = new Date("2025-01-02T00:00:00Z");
      const windowEnd = new Date("2025-01-10T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0]?.startAt.toISOString()).toBe(
        "2025-01-01T10:00:00.000Z"
      );
    });

    test("WEEKLY: stops once count is satisfied even if window allows more", () => {
      const baseStart = new Date("2025-01-08T10:00:00Z"); // Wednesday
      const baseEnd = new Date("2025-01-08T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "WEEKLY",
        interval: 1,
        count: 1,
        byDay: ["WE", "FR"],
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-02-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0]?.startAt.toISOString()).toBe(
        "2025-01-08T10:00:00.000Z"
      );
    });

    test("WEEKLY: ignores BYDAY entries with unknown offsets", () => {
      const baseStart = new Date("2025-01-08T10:00:00Z");
      const baseEnd = new Date("2025-01-08T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "WEEKLY",
        interval: 1,
        count: 2,
        byDay: ["WE", "ZZ" as Weekday, "FR"],
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-01-31T23:59:59Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.getUTCDay())).toEqual([3, 5]);
    });

    test("WEEKLY: defaults to template weekday when BYDAY is empty", () => {
      const baseStart = new Date("2025-01-08T10:00:00Z"); // Wednesday
      const baseEnd = new Date("2025-01-08T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "WEEKLY",
        interval: 1,
        count: 2,
        byDay: [],
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-01-31T23:59:59Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-08T10:00:00.000Z",
        "2025-01-15T10:00:00.000Z",
      ]);
    });

    test("WEEKLY: skips candidates earlier than the template start", () => {
      const baseStart = new Date("2025-01-08T10:00:00Z"); // Wednesday
      const baseEnd = new Date("2025-01-08T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "WEEKLY",
        interval: 1,
        count: 2,
        byDay: ["MO", "WE"],
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-01-31T23:59:59Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-08T10:00:00.000Z",
        "2025-01-13T10:00:00.000Z",
      ]);
    });

    test("WEEKLY: drops occurrences ending before window start", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z"); // Wednesday
      const baseEnd = new Date("2025-01-01T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "WEEKLY",
        interval: 1,
        count: 3,
      };
      const windowStart = new Date("2025-01-15T00:00:00Z");
      const windowEnd = new Date("2025-02-15T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-15T10:00:00.000Z",
      ]);
    });

    test("WEEKLY: drops occurrences starting after stop window", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z"); // Wednesday
      const baseEnd = new Date("2025-01-01T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "WEEKLY",
        interval: 1,
        count: 5,
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-01-20T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-01T10:00:00.000Z",
        "2025-01-08T10:00:00.000Z",
        "2025-01-15T10:00:00.000Z",
      ]);
    });

    test("WEEKLY: generates expected days when BYDAY specified", () => {
      const baseStart = new Date("2025-01-01T10:00:00Z"); // Wednesday
      const baseEnd = new Date("2025-01-01T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "WEEKLY",
        interval: 1,
        count: 4,
        byDay: ["MO", "WE"],
      };
      const windowStart = new Date("2024-12-30T00:00:00Z");
      const windowEnd = new Date("2025-01-20T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-01T10:00:00.000Z",
        "2025-01-06T10:00:00.000Z",
        "2025-01-08T10:00:00.000Z",
        "2025-01-13T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: happy path respects count within window", () => {
      const baseStart = new Date("2025-01-10T10:00:00Z");
      const baseEnd = new Date("2025-01-10T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 1,
        count: 3,
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-05-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-10T10:00:00.000Z",
        "2025-02-10T10:00:00.000Z",
        "2025-03-10T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: skips base occurrence when window starts later", () => {
      const baseStart = new Date("2025-01-10T10:00:00Z");
      const baseEnd = new Date("2025-01-10T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 1,
        count: 3,
      };
      const windowStart = new Date("2025-02-01T00:00:00Z");
      const windowEnd = new Date("2025-05-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-02-10T10:00:00.000Z",
        "2025-03-10T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: stops when candidate reaches stop window", () => {
      const baseStart = new Date("2025-01-10T10:00:00Z");
      const baseEnd = new Date("2025-01-10T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 1,
        count: 10,
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-02-28T23:59:59Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-10T10:00:00.000Z",
        "2025-02-10T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: respects UNTIL boundary even if window allows more", () => {
      const baseStart = new Date("2025-01-10T10:00:00Z");
      const baseEnd = new Date("2025-01-10T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 1,
        count: 10,
        until: new Date("2025-03-05T00:00:00Z"),
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-05-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-10T10:00:00.000Z",
        "2025-02-10T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: handles 31 Jan with interval 2 via safe month addition", () => {
      const baseStart = new Date("2025-01-31T10:00:00Z");
      const baseEnd = new Date("2025-01-31T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 2,
        count: 2,
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-06-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-31T10:00:00.000Z",
        "2025-03-31T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: leap year ensures Jan 29 leads to Feb 29", () => {
      const baseStart = new Date("2024-01-29T10:00:00Z");
      const baseEnd = new Date("2024-01-29T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 1,
        count: 2,
      };
      const windowStart = new Date("2024-01-01T00:00:00Z");
      const windowEnd = new Date("2024-04-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2024-01-29T10:00:00.000Z",
        "2024-02-29T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: non-leap year clamps Jan 29 to Feb 28", () => {
      const baseStart = new Date("2025-01-29T10:00:00Z");
      const baseEnd = new Date("2025-01-29T11:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 1,
        count: 2,
      };
      const windowStart = new Date("2025-01-01T00:00:00Z");
      const windowEnd = new Date("2025-04-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2025-01-29T10:00:00.000Z",
        "2025-02-28T10:00:00.000Z",
      ]);
    });

    test("MONTHLY: supports intervals larger than 12 months", () => {
      const baseStart = new Date("2020-01-15T12:00:00Z");
      const baseEnd = new Date("2020-01-15T13:00:00Z");
      const rule: RecurrenceRule = {
        freq: "MONTHLY",
        interval: 13,
        count: 2,
      };
      const windowStart = new Date("2019-12-01T00:00:00Z");
      const windowEnd = new Date("2022-01-01T00:00:00Z");

      const occurrences = generateOccurrences(
        baseStart,
        baseEnd,
        rule,
        windowStart,
        windowEnd
      );

      expect(occurrences.map((o) => o.startAt.toISOString())).toEqual([
        "2020-01-15T12:00:00.000Z",
        "2021-02-15T12:00:00.000Z",
      ]);
    });

    test("throws when interval is less than 1", () => {
      const templateStart = new Date("2025-01-01T10:00:00Z");
      const templateEnd = new Date("2025-01-03T10:00:00Z");
      const rule: RecurrenceRule = {
        freq: "DAILY",
        interval: 0,
        count: 5,
      };
      const windowStart = new Date("2025-03-01T10:00:00Z");
      const windowEnd = new Date("2025-05-01T10:00:00Z");

      expect(() =>
        generateOccurrences(
          templateStart,
          templateEnd,
          rule,
          windowStart,
          windowEnd
        )
      ).toThrow("Recurrence interval must be >= 1");
    });
  });
});
