"use strict";

/**
 * Syncs latestInstanceDate in recurrence_rules.json from the max actualStartTime
 * per rule in recurring_event_instances.json. Run after regenerating
 * recurring_event_instances.json to keep latestInstanceDate correct.
 * Run from repo root: node scripts/dbManagement/syncLatestInstanceDates.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const SAMPLE_DIR = path.join(__dirname, "sample_data");
const RULES_PATH = path.join(SAMPLE_DIR, "recurrence_rules.json");
const INSTANCES_PATH = path.join(SAMPLE_DIR, "recurring_event_instances.json");

function loadJson(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	return JSON.parse(content);
}

function main() {
	const rules = loadJson(RULES_PATH);
	const instances = loadJson(INSTANCES_PATH);

	// ruleId -> max actualStartTime (ISO string)
	const maxByRule = Object.create(null);
	for (const inst of instances) {
		const ruleId = inst.recurrenceRuleId;
		const start = inst.actualStartTime;
		if (!ruleId || !start) continue;
		if (
			!maxByRule[ruleId] ||
			new Date(start).getTime() > new Date(maxByRule[ruleId]).getTime()
		) {
			maxByRule[ruleId] = start;
		}
	}

	let updated = 0;
	for (const rule of rules) {
		const ruleId = rule.id;
		const maxStart = maxByRule[ruleId];
		if (maxStart) {
			const prev = rule.latestInstanceDate;
			rule.latestInstanceDate = maxStart;
			if (prev !== maxStart) updated++;
		}
		// If no instances for this rule, leave latestInstanceDate unchanged
	}

	fs.writeFileSync(
		RULES_PATH,
		`${JSON.stringify(rules, null, "\t")}\n`,
		"utf8",
	);
	console.log(
		`Updated ${updated} rule(s) in ${path.relative(process.cwd(), RULES_PATH)}`,
	);
}

main();
