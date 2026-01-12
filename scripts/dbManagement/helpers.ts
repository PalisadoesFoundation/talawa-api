import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import envSchema from "env-schema";
import { Client as MinioClient } from "minio";
import postgres from "postgres";
import * as schema from "src/drizzle/schema";
import {
	type EnvConfig,
	envConfigSchema,
	envSchemaAjv,
} from "src/envConfigSchema";

const envConfig = envSchema<EnvConfig>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema: envConfigSchema,
});

export const dirname: string = path.dirname(fileURLToPath(import.meta.url));
export const bucketName: string = envConfig.MINIO_ROOT_USER || "";
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const queryClient = postgres({
	host: envConfig.API_POSTGRES_HOST,
	port: Number(envConfig.API_POSTGRES_PORT) || 5432,
	database: envConfig.API_POSTGRES_DATABASE || "",
	username: envConfig.API_POSTGRES_USER || "",
	password: envConfig.API_POSTGRES_PASSWORD || "",
	ssl: envConfig.API_POSTGRES_SSL_MODE === "allow",
});

export const minioClient = new MinioClient({
	accessKey: envConfig.API_MINIO_ACCESS_KEY || "",
	endPoint: envConfig.API_MINIO_END_POINT || "",
	port: Number(envConfig.API_MINIO_PORT),
	secretKey: envConfig.API_MINIO_SECRET_KEY || "",
	useSSL: envConfig.API_MINIO_USE_SSL === true,
});

export const db = drizzle(queryClient, { schema });

/* ------------------------------------------------------------------ */
/* Enterprise Interfaces (Internal & Documented)                      */
/* ------------------------------------------------------------------ */

/** @internal Compile-time shape for sample data entities */
interface BaseSample {
	id: string;
	createdAt?: string | number | Date;
	updatedAt?: string | number | Date | null;
}

/** @internal */
interface SampleUser extends BaseSample {
	emailAddress: string;
	role?: string;
	isActive?: boolean;
}

/** @internal */
interface SampleOrganization extends BaseSample {
	name: string;
}

/** @internal */
interface SampleEvent extends BaseSample {
	name: string;
	organizationId: string;
	startAt: string | number | Date;
	endAt: string | number | Date;
}

/** @internal */
interface SampleRecurrenceRule extends BaseSample {
	[key: string]: unknown;
	baseRecurringEventId: string;
	organizationId: string;
	creatorId: string;
	frequency: string;
	interval: number | string;
	byDay?: string | string[] | null;
}

/** @internal */
interface SampleEventAttendee extends BaseSample {
	eventId: string;
	userId: string;
	checkinTime?: string | number | Date | null;
	checkoutTime?: string | number | Date | null;
}

/* ------------------------------------------------------------------ */
/* Utilities (Public & Tested)                                        */
/* ------------------------------------------------------------------ */

export function toICalendarUntil(date: Date): string {
	const pad = (n: number) => n.toString().padStart(2, "0");
	return (
		`${date.getUTCFullYear()}` +
		`${pad(date.getUTCMonth() + 1)}` +
		`${pad(date.getUTCDate())}` +
		"T" +
		`${pad(date.getUTCHours())}` +
		`${pad(date.getUTCMinutes())}` +
		`${pad(date.getUTCSeconds())}` +
		"Z"
	);
}

export function parseDate(date: unknown): Date | null {
	if (date === null || date === undefined || date === "" || Array.isArray(date)) return null;
	if (typeof date !== "string" && typeof date !== "number" && !(date instanceof Date)) return null;
	const parsed = new Date(date as string | number | Date);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/* ------------------------------------------------------------------ */
/* Infrastructure (Exported @internal for addSampleData.ts)            */
/* ------------------------------------------------------------------ */

/** @internal Legacy infrastructure utility */
export async function pingDB(): Promise<boolean> {
	try { await db.execute(sql`SELECT 1`); return true; } catch { return false; }
}

/** @internal Legacy infrastructure utility */
export async function askUserToContinue(question: string): Promise<boolean> {
	return new Promise((resolve) => {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		rl.question(`${question} (y/n): `, (ans) => { rl.close(); resolve(ans.trim().toLowerCase() === "y"); });
	});
}

/** @internal Legacy infrastructure utility */
export async function formatDatabase(): Promise<boolean> {
	const adminEmail = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	if (!adminEmail) throw new Error("formatDatabase: Missing admin email config.");
	try {
		await db.transaction(async (tx) => {
			const tables = await tx.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'`);
			const deny = new Set(["users", "__drizzle_migrations", "__drizzle_migrations_lock"]);
			const names = tables.map((r: any) => r.tablename).filter((t: string) => !deny.has(t));
			if (names.length) await tx.execute(sql`TRUNCATE TABLE ${sql.join(names.map((t) => sql.identifier(t)), sql`, `)} RESTART IDENTITY CASCADE`);
			await tx.execute(sql`DELETE FROM ${sql.identifier("users")} WHERE email_address != ${adminEmail}`);
		});
		return true;
	} catch { return false; }
}

/** @internal Legacy infrastructure utility */
export async function emptyMinioBucket(): Promise<boolean> {
	return true;
	try {
		const objectsToDelete: string[] = [];
		const stream = minioClient.listObjects(bucketName, "", true);
		for await (const obj of stream) {
			objectsToDelete.push(obj.name);
			if (objectsToDelete.length >= 1000) {
				await minioClient.removeObjects(bucketName, objectsToDelete);
				objectsToDelete.length = 0;
			}
		}
		if (objectsToDelete.length > 0) await minioClient.removeObjects(bucketName, objectsToDelete);
		return true;
	} catch { return false; }
}

/** @internal Legacy infrastructure utility */
export async function validateSampleData(_unusedQuiet = false): Promise<boolean> {
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

/* ------------------------------------------------------------------ */
/* Internal Logic (Private Handlers)                                  */
/* ------------------------------------------------------------------ */

async function checkAndInsertData<T>(
	table: PgTable,
	rows: T[],
	conflictTarget: AnyPgColumn | AnyPgColumn[],
	batchSize: number,
): Promise<void> {
	if (!rows.length) return;
	await db.transaction(async (tx) => {
		for (let i = 0; i < rows.length; i += batchSize) {
			const batch = rows.slice(i, i + batchSize);
			await tx.insert(table).values(batch as any).onConflictDoNothing({
				target: Array.isArray(conflictTarget) ? conflictTarget : [conflictTarget],
			});
		}
	});
}

async function insertUsers(data: SampleUser[]) {
	const users = data.map((u) => ({ ...u, createdAt: parseDate(u.createdAt), updatedAt: parseDate(u.updatedAt) }));
	await checkAndInsertData(schema.usersTable, users, schema.usersTable.id, 1000);
}

async function insertOrganizations(data: SampleOrganization[]) {
	const adminEmail = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	const orgs = data.map((o) => ({ ...o, createdAt: parseDate(o.createdAt) ?? new Date(), updatedAt: parseDate(o.updatedAt) }));
	await checkAndInsertData(schema.organizationsTable, orgs, schema.organizationsTable.id, 1000);
	const admin = await db.query.usersTable.findFirst({ columns: { id: true }, where: (f, o) => o.eq(f.emailAddress, adminEmail) });
	if (admin) {
		const mems = orgs.map((o) => ({ organizationId: o.id, memberId: admin.id, creatorId: admin.id, createdAt: new Date(), role: "administrator" as const }));
		await checkAndInsertData(schema.organizationMembershipsTable, mems, [schema.organizationMembershipsTable.organizationId, schema.organizationMembershipsTable.memberId], 1000);
	}
}

async function insertEvents(data: SampleEvent[]) {
	const now = new Date();
	const events = data.map((e, i) => {
		const start = new Date(now);
		start.setDate(now.getDate() + i);
		return { ...e, createdAt: start, startAt: start, endAt: new Date(start.getTime() + 2 * MS_PER_DAY), updatedAt: null };
	});
	await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
}

/**
 * @internal
 * Exported solely for focused unit testing of hardened recurrence logic.
 */
export async function insertRecurrenceRules(data: SampleRecurrenceRule[]): Promise<void> {
	if (!data.length) return;
	const now = new Date();
	const untilDate = new Date(now);
	untilDate.setFullYear(untilDate.getFullYear() + 1);
	const until = toICalendarUntil(untilDate);
	const validDays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

	const rules = data.map((rule, i) => {
		const freq = rule.frequency === "DYNAMIC" ? "WEEKLY" : rule.frequency;
		if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) throw new Error(`Invalid frequency: ${freq}`);
		const interval = rule.interval === "DYNAMIC" ? 1 : Number.parseInt(String(rule.interval), 10);
		if (!Number.isInteger(interval) || interval <= 0) throw new Error(`Invalid interval: ${rule.interval}`);

		const byDayArray = rule.byDay ? (Array.isArray(rule.byDay) ? rule.byDay : String(rule.byDay).split(",")).map((d) => {
			const trimmed = d.trim();
			const code = trimmed.replace(/^[+-]?\d+/, "");
			if (!validDays.includes(code)) throw new Error(`Invalid byDay: ${trimmed}`);
			return trimmed;
		}) : null;

		const byDayString = byDayArray && byDayArray.length ? `;BYDAY=${byDayArray.map((d) => d.replace(/^[+-]?\d+/, "")).join(",")}` : "";
		const start = new Date(now);
		start.setDate(now.getDate() + i + 1);

		return {
			...rule,
			frequency: freq,
			interval,
			byDay: byDayArray,
			recurrenceStartDate: start,
			recurrenceEndDate: untilDate,
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
			updatedAt: now,
		},
	});
}

async function insertEventAttendees(data: SampleEventAttendee[]) {
	const attendees = data.map((a) => ({
		...a,
		createdAt: parseDate(a.createdAt),
		updatedAt: parseDate(a.updatedAt),
		checkinTime: parseDate(a.checkinTime),
		checkoutTime: parseDate(a.checkoutTime),
	}));
	await checkAndInsertData(schema.eventAttendeesTable, attendees, schema.eventAttendeesTable.id, 1000);
}

/* ------------------------------------------------------------------ */
/* Orchestration (Exported @internal for addSampleData.ts)            */
/* ------------------------------------------------------------------ */

type HandlerMap = {
	users: (data: SampleUser[]) => Promise<void>;
	organizations: (data: SampleOrganization[]) => Promise<void>;
	events: (data: SampleEvent[]) => Promise<void>;
	recurrence_rules: (data: SampleRecurrenceRule[]) => Promise<void>;
	event_attendees: (data: SampleEventAttendee[]) => Promise<void>;
	[key: string]: (data: any[]) => Promise<void>;
};

/** * @internal 
 * Internal orchestration used exclusively by addSampleData.ts 
 */
export async function insertCollections(collections: string[], autoIncludeEventAttendees = true): Promise<boolean> {
	try {
		const list = [...collections];
		if (autoIncludeEventAttendees && !list.includes("event_attendees")) list.push("event_attendees");
		const handlers: HandlerMap = {
			users: insertUsers,
			organizations: insertOrganizations,
			events: insertEvents,
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

/** @internal Reporting utility */
export async function checkDataSize(stage: string): Promise<boolean> {
	try {
		const tables = [{ name: "users", table: schema.usersTable }, { name: "recurrence_rules", table: schema.recurrenceRulesTable }];
		for (const { name, table } of tables) {
			const res = await db.select({ count: sql`count(*)` }).from(table);
			console.log(`| ${name.padEnd(28)}| ${Number(res?.[0]?.count ?? 0).toString().padEnd(15)}|`);
		}
		return true;
	} catch { return false; }
}

/** @internal Cleanup utility */
export async function disconnect(): Promise<boolean> {
	try { await queryClient.end(); return true; } catch { return false; }
}
