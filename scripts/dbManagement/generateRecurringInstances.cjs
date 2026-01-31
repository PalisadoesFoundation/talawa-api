"use strict";

/**
 * Generates recurring_event_instances.json from events.json and recurrence_rules.json.
 * Run from repo root: node scripts/dbManagement/generateRecurringInstances.cjs
 * Output: scripts/dbManagement/sample_data/recurring_event_instances.json
 */
const fs = require("node:fs");
const path = require("node:path");

const { BYDAY_TO_DOW, parseDate } = require("./recurrenceCommon.cjs");

const SAMPLE_DIR = path.join(__dirname, "sample_data");
const EVENTS_PATH = path.join(SAMPLE_DIR, "events.json");
const RULES_PATH = path.join(SAMPLE_DIR, "recurrence_rules.json");
const OUT_PATH = path.join(SAMPLE_DIR, "recurring_event_instances.json");

const DEFAULT_MONTHS_AHEAD = 12;
const WEEKS_PER_YEAR = 52;
const DEFAULT_GENERATED_AT = "2026-01-30T16:40:06.045Z";

function toISOString(d) {
	return d.toISOString();
}

function pad12Hex(n) {
	return n.toString(16).padStart(12, "0");
}

function buildInstanceId(ruleIndex1Based, seqNumber) {
	const rHex = ruleIndex1Based.toString(16).padStart(2, "0");
	const sHex = pad12Hex(seqNumber);
	const seg4 = `c0${(seqNumber % 256).toString(16).padStart(2, "0")}`;
	return `01960b97-00c1-72${rHex}-${seg4}-${sHex}`;
}

function buildInstanceRecord(
	ruleIndex,
	seq,
	baseId,
	ruleId,
	seriesId,
	instanceStart,
	durationMs,
	orgId,
	generatedAt,
) {
	return {
		id: buildInstanceId(ruleIndex, seq),
		baseRecurringEventId: baseId,
		recurrenceRuleId: ruleId,
		originalSeriesId: seriesId,
		originalInstanceStartTime: toISOString(instanceStart),
		actualStartTime: toISOString(instanceStart),
		actualEndTime: toISOString(new Date(instanceStart.getTime() + durationMs)),
		isCancelled: false,
		organizationId: orgId,
		generatedAt: generatedAt ?? DEFAULT_GENERATED_AT,
		lastUpdatedAt: null,
		version: "1",
		sequenceNumber: seq,
		totalCount: null,
	};
}

/** Return the nth (1-based) occurrence of weekday dow in the given UTC year/month. */
function getNthWeekdayOfMonth(year, month, dow, n) {
	const first = new Date(Date.UTC(year, month, 1));
	const firstDOW = first.getUTCDay();
	let date = 1 + ((dow - firstDOW + 7) % 7);
	date += (n - 1) * 7;
	const d = new Date(Date.UTC(year, month, date));
	if (d.getUTCMonth() !== month) return null;
	return d;
}

/** Parse byDay entry for monthly: "2MO" -> { n: 2, dow: 1 }; "MO" -> { n: 1, dow: 1 }. */
function parseByDayMonthly(byDayEntry) {
	const m = String(byDayEntry).match(/^(\d)?(MO|TU|WE|TH|FR|SA|SU)$/i);
	if (!m) return null;
	const n = m[1] ? parseInt(m[1], 10) : 1;
	const dow = BYDAY_TO_DOW[m[2].toUpperCase()];
	return dow !== undefined ? { n, dow } : null;
}

function loadJson(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	try {
		return JSON.parse(content);
	} catch (err) {
		throw new Error(`Invalid JSON at ${filePath}: ${err.message}`);
	}
}

/**
 * Generate recurring event instances from events and rules.
 * @param {Array} events - Array of event objects (must include isRecurringEventTemplate templates)
 * @param {Array} rules - Array of recurrence rule objects (frequency, interval, recurrenceStartDate, byDay, etc.)
 * @param {{ monthsAhead?: number, generatedAt?: string }} options - Optional: monthsAhead (default 12), generatedAt
 * @returns {Array} Array of instance records for recurring_event_instances
 */
function generateInstances(events, rules, options = {}) {
	const monthsAhead = options.monthsAhead ?? DEFAULT_MONTHS_AHEAD;
	const generatedAt = options.generatedAt ?? DEFAULT_GENERATED_AT;
	const maxWeeks = Math.ceil((monthsAhead * WEEKS_PER_YEAR) / 12);

	const templateByEventId = Object.fromEntries(
		events
			.filter((e) => e.isRecurringEventTemplate === true)
			.map((e) => [e.id, e]),
	);

	const instances = [];
	let ruleIndex = 0;

	for (const rule of rules) {
		ruleIndex++;
		const template = templateByEventId[rule.baseRecurringEventId];
		if (!template) continue;

		const start = parseDate(rule.recurrenceStartDate);
		if (!start) continue;

		const startAt = parseDate(template.startAt);
		const endAt = parseDate(template.endAt);
		if (
			!startAt ||
			Number.isNaN(startAt.getTime()) ||
			!endAt ||
			Number.isNaN(endAt.getTime()) ||
			endAt.getTime() <= startAt.getTime()
		) {
			continue;
		}
		const durationMs = endAt.getTime() - startAt.getTime();

		const endDate = new Date(start);
		endDate.setUTCMonth(endDate.getUTCMonth() + monthsAhead);

		const frequency = (rule.frequency || "WEEKLY").toUpperCase();
		const interval = Math.max(1, parseInt(rule.interval, 10) || 1);
		const byDay = rule.byDay ?? [];
		const wantDOW = byDay
			.map((d) => BYDAY_TO_DOW[d])
			.filter((x) => x !== undefined);

		let seq = 0;
		const startDOW = start.getUTCDay();

		if (frequency === "MONTHLY") {
			const byMonthDay =
				rule.byMonthDay && rule.byMonthDay.length > 0
					? rule.byMonthDay
					: [start.getUTCDate()];
			const byDayMonthly =
				byDay.length > 0 ? byDay.map(parseByDayMonthly).filter(Boolean) : null;
			const startUTCHours = start.getUTCHours();
			const startUTCMinutes = start.getUTCMinutes();
			const startUTCSeconds = start.getUTCSeconds();
			const startUTCMs = start.getUTCMilliseconds();
			const startYear = start.getUTCFullYear();
			const startMonth = start.getUTCMonth();
			for (let m = 0; m < monthsAhead; m += interval) {
				const y = startYear + Math.floor((startMonth + m) / 12);
				const mo = (startMonth + m) % 12;
				const candidate = new Date(Date.UTC(y, mo, 1));
				if (candidate > endDate) break;
				let instanceStart = null;
				if (byDayMonthly && byDayMonthly.length > 0) {
					const { n, dow } = byDayMonthly[0];
					instanceStart = getNthWeekdayOfMonth(y, mo, dow, n);
				}
				if (!instanceStart && byMonthDay.length > 0) {
					const day = byMonthDay[0];
					const lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
					const date =
						day < 0 ? Math.max(1, lastDay + day + 1) : Math.min(day, lastDay);
					instanceStart = new Date(Date.UTC(y, mo, date));
				}
				if (!instanceStart) {
					instanceStart = new Date(Date.UTC(y, mo, start.getUTCDate()));
					const lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
					if (instanceStart.getUTCDate() > lastDay) {
						instanceStart.setUTCDate(lastDay);
					}
				}
				instanceStart.setUTCHours(
					startUTCHours,
					startUTCMinutes,
					startUTCSeconds,
					startUTCMs,
				);
				if (instanceStart > endDate) continue;
				seq++;
				instances.push(
					buildInstanceRecord(
						ruleIndex,
						seq,
						rule.baseRecurringEventId,
						rule.id,
						rule.originalSeriesId ?? rule.id,
						instanceStart,
						durationMs,
						rule.organizationId,
						generatedAt,
					),
				);
			}
		} else {
			if (wantDOW.length === 0) {
				for (let w = 0; w < maxWeeks; w += interval) {
					const instanceStart = new Date(start);
					instanceStart.setUTCDate(instanceStart.getUTCDate() + w * 7);
					if (instanceStart > endDate) break;
					seq++;
					instances.push(
						buildInstanceRecord(
							ruleIndex,
							seq,
							rule.baseRecurringEventId,
							rule.id,
							rule.originalSeriesId ?? rule.id,
							instanceStart,
							durationMs,
							rule.organizationId,
							generatedAt,
						),
					);
				}
			} else {
				const minOffset = Math.min(
					...wantDOW.map((dow) => (dow - startDOW + 7) % 7),
				);
				for (let w = 0; w < maxWeeks; w += interval) {
					const earliestInstanceStart = new Date(start);
					earliestInstanceStart.setUTCDate(
						earliestInstanceStart.getUTCDate() + w * 7 + minOffset,
					);
					if (earliestInstanceStart > endDate) break;
					for (const dow of wantDOW) {
						const offset = (dow - startDOW + 7) % 7;
						const instanceStart = new Date(start);
						instanceStart.setUTCDate(
							instanceStart.getUTCDate() + w * 7 + offset,
						);
						if (instanceStart > endDate) continue;
						seq++;
						instances.push(
							buildInstanceRecord(
								ruleIndex,
								seq,
								rule.baseRecurringEventId,
								rule.id,
								rule.originalSeriesId ?? rule.id,
								instanceStart,
								durationMs,
								rule.organizationId,
								generatedAt,
							),
						);
					}
				}
			}
		}
	}

	return instances;
}

function main() {
	const events = loadJson(EVENTS_PATH);
	const rules = loadJson(RULES_PATH);
	const instances = generateInstances(events, rules);
	fs.writeFileSync(
		OUT_PATH,
		`${JSON.stringify(instances, null, "\t")}\n`,
		"utf8",
	);
	console.log("Wrote", instances.length, "instances to", OUT_PATH);
}

if (require.main === module) {
	main();
}

module.exports = {
	parseDate,
	buildInstanceId,
	buildInstanceRecord,
	generateInstances,
	getNthWeekdayOfMonth,
	BYDAY_TO_DOW,
	DEFAULT_MONTHS_AHEAD,
	WEEKS_PER_YEAR,
};
