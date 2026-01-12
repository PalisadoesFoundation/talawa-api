import { sql, eq } from "drizzle-orm";
import { drizzleClient as db } from "~/src/drizzle/client";
import * as schema from "~/src/drizzle/schema";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { envConfig } from "~/src/envConfig";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Types ---
type SampleUser = typeof schema.usersTable.$inferInsert;
type SampleOrganization = typeof schema.organizationsTable.$inferInsert;
type SampleEvent = typeof schema.eventsTable.$inferInsert;
type SampleRecurrenceRule = typeof schema.recurrenceRulesTable.$inferInsert & {
	frequency: string | "DYNAMIC";
	interval: number | string | "DYNAMIC";
	byDay?: string | string[];
};
type SampleEventAttendee = typeof schema.eventAttendeesTable.$inferInsert;

type HandlerMap = {
	users: (data: SampleUser[]) => Promise<void>;
	organizations: (data: SampleOrganization[]) => Promise<void>;
	events: (data: SampleEvent[]) => Promise<void>;
	recurring_events: (data: SampleEvent[]) => Promise<void>;
	recurrence_rules: (data: SampleRecurrenceRule[]) => Promise<void>;
	event_attendees: (data: SampleEventAttendee[]) => Promise<void>;
	[key: string]: (data: any[]) => Promise<void>;
};

// --- Utilities ---
const toICalendarUntil = (date: Date) => date.toISOString().replace(/[:.-]/g, "").slice(0, 15) + "Z";

// --- Database Operations ---

export async function pingDB(): Promise<boolean> {
	try { await db.execute(sql`SELECT 1`); return true; } catch { return false; }
}

/**
 * Clears all tables in the database except for the admin user.
 */
export async function formatDatabase(): Promise<boolean> {
	const adminEmail = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	if (!adminEmail) throw new Error("formatDatabase: Missing admin email config.");

	try {
		await db.transaction(async (tx) => {
			const tables = await tx.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'`);
			const deny = new Set(["users", "__drizzle_migrations", "__drizzle_migrations_lock"]);
			const names = tables.map((r: any) => r.tablename).filter((t: string) => !deny.has(t));
			
			if (names.length) {
				await tx.execute(sql`TRUNCATE TABLE ${sql.join(names.map((t) => sql.identifier(t)), sql`, `)} RESTART IDENTITY CASCADE`);
			}
			await tx.execute(sql`DELETE FROM ${sql.identifier("users")} WHERE email_address != ${adminEmail}`);
		});
		return true;
	} catch { return false; }
}

export async function insertUsers(data: SampleUser[]): Promise<void> {
	if (!data.length) return;
	await db.insert(schema.usersTable).values(data).onConflictDoNothing();
}

export async function insertOrganizations(data: SampleOrganization[]): Promise<void> {
	if (!data.length) return;
	await db.insert(schema.organizationsTable).values(data).onConflictDoNothing();
}

export async function insertEvents(data: SampleEvent[]): Promise<void> {
	if (!data.length) return;
	await db.insert(schema.eventsTable).values(data).onConflictDoNothing();
}

export async function insertRecurrenceRules(data: SampleRecurrenceRule[]): Promise<void> {
	if (!data.length) return;
	const now = new Date();
	const untilDate = new Date(now);
	untilDate.setFullYear(untilDate.getFullYear() + 1);
	const until = toICalendarUntil(untilDate);
	const validDays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

	const rules = data.map((rule, i) => {
		const freq = rule.frequency === "DYNAMIC" ? "WEEKLY" : rule.frequency;
		const interval = rule.interval === "DYNAMIC" ? 1 : Number.parseInt(String(rule.interval), 10);
		
		const byDayArray = rule.byDay ? (Array.isArray(rule.byDay) ? rule.byDay : String(rule.byDay).split(",")).map((d) => {
			const trimmed = d.trim();
			const code = trimmed.replace(/^[+-]?\d+/, "");
			if (!validDays.includes(code)) throw new Error(`Invalid byDay: ${trimmed}`);
			return trimmed;
		}) : null;

		const byDayString = byDayArray && byDayArray.length ? `;BYDAY=${byDayArray.join(",")}` : "";
		const start = new Date(now);
		start.setDate(now.getDate() + i + 1);

		return {
			...rule,
			frequency: freq,
			interval,
			byDay: byDayArray,
			recurrenceStartDate: start,
			recurrenceEndDate: untilDate,
			latestInstanceDate: start,
			recurrenceRuleString: `FREQ=${freq};INTERVAL=${interval}${byDayString};UNTIL=${until}`,
			createdAt: now,
			updatedAt: now,
		};
	});

	await db.insert(schema.recurrenceRulesTable).values(rules as any).onConflictDoUpdate({
		target: schema.recurrenceRulesTable.id,
		set: {
			frequency: sql`excluded.frequency`,
			interval: sql`excluded.interval`,
			recurrenceRuleString: sql`excluded.recurrence_rule_string`,
			latestInstanceDate: sql`excluded.latest_instance_date`,
			updatedAt: now,
		},
	});
}

export async function insertEventAttendees(data: SampleEventAttendee[]): Promise<void> {
	if (!data.length) return;
	await db.insert(schema.eventAttendeesTable).values(data).onConflictDoNothing();
}

/**
 * Orchestrates the insertion of data collections from JSON samples.
 */
export async function insertCollections(collections: string[], autoIncludeEventAttendees = true): Promise<boolean> {
	try {
		const list = [...collections];
		if (autoIncludeEventAttendees && !list.includes("event_attendees")) list.push("event_attendees");
		
		const handlers: HandlerMap = {
			users: insertUsers,
			organizations: insertOrganizations,
			events: insertEvents,
			recurring_events: insertEvents,
			recurrence_rules: insertRecurrenceRules,
			event_attendees: insertEventAttendees,
		}; 

		for (const col of list) {
			const handler = handlers[col];
			if (!handler) { console.warn(`insertCollections: No handler for '${col}'. Skipping.`); continue; }
			const dataPath = path.resolve(dirname, `./sample_data/${col}.json`);
			const content = await fs.readFile(dataPath, "utf8");
			await handler(JSON.parse(content));
		}
		return true;
	} catch { return false; }
}

export async function validateSampleData(): Promise<boolean> {
	try {
		const files = await fs.readdir(path.resolve(dirname, "./sample_data"));
		for (const f of files) {
			if (!f.endsWith(".json")) continue;
			const content = await fs.readFile(path.resolve(dirname, "./sample_data", f), "utf8");
			if (!Array.isArray(JSON.parse(content))) return false;
		}
		return true;
	} catch { return false; }
}
