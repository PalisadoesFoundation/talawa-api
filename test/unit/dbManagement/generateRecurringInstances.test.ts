import { describe, expect, test } from "vitest";

const {
	generateInstances,
	buildInstanceRecord,
	parseDate,
	buildInstanceId,
	getNthWeekdayOfMonth,
	BYDAY_TO_DOW,
} = require("../../../scripts/dbManagement/generateRecurringInstances.cjs") as {
	generateInstances: (
		events: unknown[],
		rules: unknown[],
		options?: { monthsAhead?: number; generatedAt?: string },
	) => unknown[];
	buildInstanceRecord: (
		ruleIndex: number,
		seq: number,
		baseId: string,
		ruleId: string,
		seriesId: string,
		instanceStart: Date,
		durationMs: number,
		orgId: string,
		generatedAt?: string,
	) => unknown;
	parseDate: (s: string | number | Date) => Date | null;
	buildInstanceId: (ruleIndex: number, seq: number) => string;
	getNthWeekdayOfMonth: (
		year: number,
		month: number,
		dow: number,
		n: number,
	) => Date | null;
	BYDAY_TO_DOW: Record<string, number>;
};

const ORG_ID = "01960b81-bfed-7369-ae96-689dbd4281ba";
const BASE_ID = "01960b97-00c1-7001-a001-000000000001";
const RULE_ID = "01960b97-00c1-7101-b101-000000000001";

function syntheticTemplate(
	overrides: { startAt?: string; endAt?: string; id?: string } = {},
) {
	return {
		id: BASE_ID,
		startAt: "2026-02-02T06:00:00.000Z",
		endAt: "2026-02-02T07:00:00.000Z",
		isRecurringEventTemplate: true,
		...overrides,
	};
}

function syntheticRule(
	overrides: {
		frequency?: string;
		interval?: number;
		recurrenceStartDate?: string;
		byDay?: string[] | null;
		baseRecurringEventId?: string;
		originalSeriesId?: string;
		id?: string;
	} = {},
) {
	return {
		id: RULE_ID,
		baseRecurringEventId: BASE_ID,
		organizationId: ORG_ID,
		originalSeriesId: RULE_ID,
		frequency: "WEEKLY",
		interval: 1,
		recurrenceStartDate: "2026-02-02T06:00:00.000Z",
		byDay: null,
		...overrides,
	};
}

describe("generateRecurringInstances", () => {
	test("weekly branch with no byDay (wantDOW.length === 0) produces one instance per week", () => {
		const events = [syntheticTemplate()];
		const rules = [syntheticRule({ byDay: null })];
		const instances = generateInstances(events, rules, {
			monthsAhead: 2,
			generatedAt: "2026-01-01T00:00:00.000Z",
		}) as unknown[];
		expect(instances.length).toBeGreaterThanOrEqual(8);
		expect(instances.length).toBeLessThanOrEqual(10);
		const first = instances[0] as {
			sequenceNumber: number;
			actualStartTime: string;
		};
		const last = instances[instances.length - 1] as {
			sequenceNumber: number;
			actualStartTime: string;
		};
		expect(first.sequenceNumber).toBe(1);
		expect(last.sequenceNumber).toBe(instances.length);
		expect(first.actualStartTime).toBe("2026-02-02T06:00:00.000Z");
	});

	test("weekly branch with byDay populated uses minOffset and produces instances on correct weekdays", () => {
		const events = [syntheticTemplate()];
		const rules = [
			syntheticRule({
				byDay: ["MO", "WE"],
				recurrenceStartDate: "2026-02-02T06:00:00.000Z",
			}),
		];
		const instances = generateInstances(events, rules, {
			monthsAhead: 1,
			generatedAt: "2026-01-01T00:00:00.000Z",
		}) as unknown[];
		expect(instances.length).toBeGreaterThanOrEqual(8);
		const starts = (instances as { actualStartTime: string }[]).map(
			(i) => i.actualStartTime,
		);
		const mondays = starts.filter((s) => {
			const d = new Date(s);
			return d.getUTCDay() === 1;
		});
		const wednesdays = starts.filter((s) => {
			const d = new Date(s);
			return d.getUTCDay() === 3;
		});
		expect(mondays.length).toBeGreaterThan(0);
		expect(wednesdays.length).toBeGreaterThan(0);
	});

	test("endDate cutoff: instances beyond endDate are omitted", () => {
		const events = [syntheticTemplate()];
		const rules = [syntheticRule({ byDay: null })];
		const instances = generateInstances(events, rules, {
			monthsAhead: 1,
			generatedAt: "2026-01-01T00:00:00.000Z",
		}) as unknown[];
		const endDate = new Date("2026-02-02T06:00:00.000Z");
		endDate.setUTCMonth(endDate.getUTCMonth() + 1);
		for (const inst of instances as { actualStartTime: string }[]) {
			expect(new Date(inst.actualStartTime).getTime()).toBeLessThanOrEqual(
				endDate.getTime(),
			);
		}
	});

	test("buildInstanceRecord returns correct start and duration from template", () => {
		const start = new Date("2026-02-02T06:00:00.000Z");
		const durationMs = 60 * 60 * 1000;
		const record = buildInstanceRecord(
			1,
			1,
			BASE_ID,
			RULE_ID,
			RULE_ID,
			start,
			durationMs,
			ORG_ID,
			"2026-01-01T00:00:00.000Z",
		) as {
			actualStartTime: string;
			actualEndTime: string;
			sequenceNumber: number;
		};
		expect(record.actualStartTime).toBe("2026-02-02T06:00:00.000Z");
		expect(record.actualEndTime).toBe("2026-02-02T07:00:00.000Z");
		expect(record.sequenceNumber).toBe(1);
	});

	test("template with invalid or missing startAt/endAt is skipped", () => {
		const events = [
			syntheticTemplate({
				startAt: "invalid",
				endAt: "2026-02-02T07:00:00.000Z",
			}),
		];
		const rules = [syntheticRule()];
		const instances = generateInstances(events, rules, { monthsAhead: 12 });
		expect(instances).toHaveLength(0);
	});

	test("template with endAt <= startAt is skipped", () => {
		const events = [
			syntheticTemplate({
				startAt: "2026-02-02T07:00:00.000Z",
				endAt: "2026-02-02T06:00:00.000Z",
			}),
		];
		const rules = [syntheticRule()];
		const instances = generateInstances(events, rules, { monthsAhead: 12 });
		expect(instances).toHaveLength(0);
	});

	test("monthly recurrence produces one instance per interval months", () => {
		const events = [
			syntheticTemplate({
				startAt: "2026-02-15T14:00:00.000Z",
				endAt: "2026-02-15T16:00:00.000Z",
			}),
		];
		const rules = [
			syntheticRule({
				frequency: "MONTHLY",
				interval: 1,
				recurrenceStartDate: "2026-02-15T14:00:00.000Z",
				byDay: null,
			}),
		];
		const instances = generateInstances(events, rules, {
			monthsAhead: 6,
			generatedAt: "2026-01-01T00:00:00.000Z",
		}) as unknown[];
		expect(instances.length).toBeGreaterThanOrEqual(5);
		expect(instances.length).toBeLessThanOrEqual(7);
		const first = instances[0] as { actualStartTime: string };
		expect(first.actualStartTime).toMatch(/2026-02-15T14:00:00/);
	});

	test("monthly recurrence with byDay uses nth weekday of month", () => {
		// 2026-02-09 is the second Monday of February 2026
		const events = [
			syntheticTemplate({
				startAt: "2026-02-09T14:00:00.000Z", // A Monday
				endAt: "2026-02-09T16:00:00.000Z",
			}),
		];
		const rules = [
			syntheticRule({
				frequency: "MONTHLY",
				interval: 1,
				recurrenceStartDate: "2026-02-09T14:00:00.000Z",
				byDay: ["2MO"], // Second Monday of each month
			}),
		];
		const instances = generateInstances(events, rules, {
			monthsAhead: 3,
			generatedAt: "2026-01-01T00:00:00.000Z",
		}) as { actualStartTime: string }[];
		// Verify each instance falls on a Monday (2nd weekday of month = date 8–14)
		for (const inst of instances) {
			const d = new Date(inst.actualStartTime);
			expect(d.getUTCDay()).toBe(1); // Monday
			expect(d.getUTCDate()).toBeGreaterThanOrEqual(8);
			expect(d.getUTCDate()).toBeLessThanOrEqual(14);
		}
	});

	test("sequence numbers are strictly increasing per rule", () => {
		const events = [
			syntheticTemplate(),
			syntheticTemplate({
				id: "01960b97-00c1-7002-a002-000000000002",
				startAt: "2026-02-02T14:00:00.000Z",
				endAt: "2026-02-02T15:00:00.000Z",
			}),
		];
		const rules = [
			syntheticRule({ byDay: null }),
			syntheticRule({
				id: "01960b97-00c1-7102-b102-000000000002",
				baseRecurringEventId: "01960b97-00c1-7002-a002-000000000002",
				originalSeriesId: "01960b97-00c1-7102-b102-000000000002",
				byDay: ["MO"],
				recurrenceStartDate: "2026-02-02T14:00:00.000Z",
			}),
		];
		const instances = generateInstances(events, rules, {
			monthsAhead: 2,
		}) as { recurrenceRuleId: string; sequenceNumber: number }[];
		const byRule = new Map<string, number[]>();
		for (const inst of instances) {
			const arr = byRule.get(inst.recurrenceRuleId) ?? [];
			arr.push(inst.sequenceNumber);
			byRule.set(inst.recurrenceRuleId, arr);
		}
		for (const seqs of byRule.values()) {
			for (let i = 1; i < seqs.length; i++) {
				const curr = seqs[i];
				const prev = seqs[i - 1];
				expect(curr).toBeDefined();
				expect(prev).toBeDefined();
				expect(curr).toBe((prev as number) + 1);
			}
		}
	});

	test("MONTHS_AHEAD / MAX_WEEKS boundary: small monthsAhead yields fewer instances", () => {
		const events = [syntheticTemplate()];
		const rules = [syntheticRule({ byDay: null })];
		const oneMonth = generateInstances(events, rules, {
			monthsAhead: 1,
		}) as unknown[];
		const threeMonths = generateInstances(events, rules, {
			monthsAhead: 3,
		}) as unknown[];
		expect(oneMonth.length).toBeLessThan(threeMonths.length);
		expect(oneMonth.length).toBeGreaterThanOrEqual(4);
		expect(threeMonths.length).toBeGreaterThanOrEqual(12);
	});
});

describe("parseDate", () => {
	test("returns null for invalid date", () => {
		expect(parseDate("not-a-date")).toBeNull();
	});
	test("returns Date for valid ISO string", () => {
		const d = parseDate("2026-02-02T06:00:00.000Z");
		expect(d).not.toBeNull();
		expect((d as Date).toISOString()).toBe("2026-02-02T06:00:00.000Z");
	});
});

describe("buildInstanceId", () => {
	test("produces 12-hex final segment for sequence 10", () => {
		const id = buildInstanceId(1, 10);
		const lastSegment = id.split("-").at(-1);
		expect(lastSegment).toHaveLength(12);
		expect(lastSegment).toMatch(/^[0-9a-f]{12}$/);
	});
});

describe("getNthWeekdayOfMonth", () => {
	test("returns second Monday of Feb 2026", () => {
		const monday = BYDAY_TO_DOW["MO"] ?? 1;
		const d = getNthWeekdayOfMonth(2026, 1, monday, 2);
		expect(d).not.toBeNull();
		expect((d as Date).getUTCDate()).toBe(9);
		expect((d as Date).getUTCMonth()).toBe(1);
	});
});
