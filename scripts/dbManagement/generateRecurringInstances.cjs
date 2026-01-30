"use strict";

/**
 * Generates recurring_event_instances.json from events.json and recurrence_rules.json.
 * Run from repo root: node scripts/dbManagement/generateRecurringInstances.cjs
 * Output: scripts/dbManagement/sample_data/recurring_event_instances.json
 */
const fs = require("fs");
const path = require("path");

const SAMPLE_DIR = path.join(__dirname, "sample_data");
const EVENTS_PATH = path.join(SAMPLE_DIR, "events.json");
const RULES_PATH = path.join(SAMPLE_DIR, "recurrence_rules.json");
const OUT_PATH = path.join(SAMPLE_DIR, "recurring_event_instances.json");

const MONTHS_AHEAD = 12;
const WEEKS_PER_YEAR = 52;
const MAX_WEEKS = WEEKS_PER_YEAR * MONTHS_AHEAD;
const GENERATED_AT = "2026-01-30T16:40:06.045Z";

const BYDAY_TO_DOW = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };

function parseDate(s) {
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? null : d;
}

function toISOString(d) {
	return d.toISOString().replace(/\.000Z$/, ".000Z");
}

function pad12Hex(n) {
	return n.toString(16).padStart(12, "0");
}

function buildInstanceId(ruleIndex1Based, seqNumber) {
	const rHex = ruleIndex1Based.toString(16).padStart(2, "0");
	const sHex = pad12Hex(seqNumber);
	const seg4 = "c0" + (seqNumber % 256).toString(16).padStart(2, "0");
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
		generatedAt: GENERATED_AT,
		lastUpdatedAt: null,
		version: "1",
		sequenceNumber: seq,
		totalCount: null,
	};
}

function loadJson(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	try {
		return JSON.parse(content);
	} catch (err) {
		throw new Error(`Invalid JSON at ${filePath}: ${err.message}`);
	}
}

function main() {
	const events = loadJson(EVENTS_PATH);
	const rules = loadJson(RULES_PATH);

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

		const durationMs =
			new Date(template.endAt).getTime() - new Date(template.startAt).getTime();
		const byDay = rule.byDay ?? [];
		const wantDOW = byDay
			.map((d) => BYDAY_TO_DOW[d])
			.filter((x) => x !== undefined);

		const endDate = new Date(start);
		endDate.setUTCMonth(endDate.getUTCMonth() + MONTHS_AHEAD);

		let seq = 0;
		const startDOW = start.getUTCDay();

		if (wantDOW.length === 0) {
			for (let w = 0; w < MAX_WEEKS; w++) {
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
					),
				);
			}
		} else {
			for (let w = 0; w < MAX_WEEKS; w++) {
				for (const dow of wantDOW) {
					const offset = (dow - startDOW + 7) % 7;
					const instanceStart = new Date(start);
					instanceStart.setUTCDate(instanceStart.getUTCDate() + w * 7 + offset);
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
						),
					);
				}
			}
		}
	}

	fs.writeFileSync(
		OUT_PATH,
		JSON.stringify(instances, null, "\t") + "\n",
		"utf8",
	);
	console.log("Wrote", instances.length, "instances to", OUT_PATH);
}

main();
