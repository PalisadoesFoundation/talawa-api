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

// --- Enterprise Interfaces ---

interface BaseSample {
	id: string;
	createdAt?: string | number | Date;
	updatedAt?: string | number | Date | null;
}

interface SampleUser extends BaseSample {
	emailAddress: string;
	firstName?: string;
	lastName?: string;
	role?: string;
	isActive?: boolean;
}

interface SampleOrganization extends BaseSample {
	name: string;
}

interface SampleEvent extends BaseSample {
	name: string;
	organizationId: string;
	startAt: string | number | Date;
	endAt: string | number | Date;
}

interface SampleRecurrenceRule extends BaseSample {
	[key: string]: unknown; 
	baseRecurringEventId: string;
	organizationId: string;
	creatorId: string;
	frequency: string;
	interval: number | string;
	byDay?: string | string[] | null;
}

interface SampleEventAttendee extends BaseSample {
	eventId: string;
	userId: string;
	checkinTime?: string | number | Date | null;
	checkoutTime?: string | number | Date | null;
}

// --- Utilities ---

export function toICalendarUntil(date: Date): string {
	const pad = (n: number) => n.toString().padStart(2, "0");
	return (
		date.getUTCFullYear().toString() +
		pad(date.getUTCMonth() + 1) +
		pad(date.getUTCDate()) +
		"T" +
		pad(date.getUTCHours()) +
		pad(date.getUTCMinutes()) +
		pad(date.getUTCSeconds()) +
		"Z"
	);
}

export function parseDate(date: unknown): Date | null {
	if (date === null || date === undefined || date === "" || Array.isArray(date)) return null;
	if (typeof date !== "string" && typeof date !== "number" && !(date instanceof Date)) return null;
	const parsedDate = new Date(date as string | number | Date);
	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export async function askUserToContinue(question: string): Promise<boolean> {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question(`${question} (y/n): `, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase() === "y");
		});
	});
}

export async function formatDatabase(): Promise<boolean> {
	const adminEmail = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	if (!adminEmail) throw new Error("formatDatabase: Missing required API_ADMINISTRATOR_USER_EMAIL_ADDRESS env var.");

	const USERS_TABLE = "users";
	const DENY_LIST = new Set([USERS_TABLE, "__drizzle_migrations", "__drizzle_migrations_lock"]);

	try {
		await db.transaction(async (tx) => {
			const tables = await tx.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`);
			const tableNames = tables.map((row: any) => row.tablename).filter((name) => !DENY_LIST.has(name));

			if (tableNames.length > 0) {
				await tx.execute(sql`TRUNCATE TABLE ${sql.join(tableNames.map((t) => sql.identifier(t)), sql`, `)} RESTART IDENTITY CASCADE;`);
			}
			await tx.execute(sql`DELETE FROM ${sql.identifier(USERS_TABLE)} WHERE email_address != ${adminEmail};`);
		});
		return true;
	} catch (error) {
		console.error("formatDatabase failed:", error);
		return false;
	}
}

export async function emptyMinioBucket(): Promise<boolean> {
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

		if (objectsToDelete.length > 0) {
			await minioClient.removeObjects(bucketName, objectsToDelete);
		}
		return true;
	} catch (error: unknown) {
		console.error("emptyMinioBucket failed:", error);
		return false;
	}
}

export async function validateSampleData(quiet = false): Promise<boolean> {
	try {
		const sampleDataPath = path.resolve(dirname, "./sample_data");
		const files = await fs.readdir(sampleDataPath);
		let errorsFound = false;
		for (const file of files) {
			if (!file.endsWith(".json")) continue;
			try {
				const content = await fs.readFile(path.resolve(sampleDataPath, file), "utf8");
				const docs = JSON.parse(content);
				if (!Array.isArray(docs)) errorsFound = true;
			} catch (e) {
				errorsFound = true;
			}
		}
		return !errorsFound;
	} catch (error) {
		return false;
	}
}

export async function pingDB(): Promise<boolean> {
	try {
		await db.execute(sql`SELECT 1`);
		return true;
	} catch (error) {
		return false;
	}
}

export async function checkAndInsertData<T>(
	table: PgTable,
	rows: T[],
	conflictTarget: AnyPgColumn | AnyPgColumn[],
	batchSize: number,
): Promise<boolean> {
	if (!rows.length) return false;
	await db.transaction(async (tx) => {
		for (let i = 0; i < rows.length; i += batchSize) {
			const batch = rows.slice(i, i + batchSize);
			await tx.insert(table).values(batch as any).onConflictDoNothing({
				target: Array.isArray(conflictTarget) ? conflictTarget : [conflictTarget],
			});
		}
	});
	return true;
}

// --- Handlers (Exported for CI/CD unit testing enforcement) ---

export async function insertUsers(data: SampleUser[]) {
	const users = data.map((u) => {
		const pc = parseDate(u.createdAt);
		const pu = parseDate(u.updatedAt);
		return { ...u, createdAt: pc, updatedAt: pu };
	});
	await checkAndInsertData(schema.usersTable, users, schema.usersTable.id, 1000);
}

export async function insertOrganizations(data: SampleOrganization[]) {
	const adminEmail = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	if (!adminEmail) throw new Error("API_ADMINISTRATOR_USER_EMAIL_ADDRESS missing.");

	const organizations = data.map((org) => ({
		...org,
		createdAt: parseDate(org.createdAt) ?? new Date(),
		updatedAt: parseDate(org.updatedAt),
	}));
	await checkAndInsertData(schema.organizationsTable, organizations, schema.organizationsTable.id, 1000);

	const adminUser = await db.query.usersTable.findFirst({
		columns: { id: true },
		where: (fields, operators) => operators.eq(fields.emailAddress, adminEmail),
	});

	if (adminUser) {
		const memberships = organizations.map((org) => ({
			organizationId: org.id,
			memberId: adminUser.id,
			creatorId: adminUser.id,
			createdAt: new Date(),
			role: "administrator" as const,
		}));
		await checkAndInsertData(schema.organizationMembershipsTable, memberships, [schema.organizationMembershipsTable.organizationId, schema.organizationMembershipsTable.memberId], 1000);
	} else {
		console.warn(`insertOrganizations: Admin user (${adminEmail}) not found. Skipping memberships.`);
	}
}

export async function insertEvents(data: SampleEvent[]) {
	const now = new Date();
	const events = data.map((e, i) => {
		const start = new Date(now);
		start.setDate(now.getDate() + i);
		return { ...e, createdAt: start, startAt: start, endAt: new Date(start.getTime() + 2 * MS_PER_DAY), updatedAt: null };
	});
	await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
}

export async function insertRecurringEvents(data: SampleEvent[]) {
	const now = new Date();
	const events = data.map((e, i) => {
		const startAt = new Date(now);
		startAt.setDate(now.getDate() + i + 1);
		startAt.setHours(9 + (i % 5), 0, 0, 0);
		const endAt = new Date(startAt);
		endAt.setHours(startAt.getHours() + 1, 0, 0, 0);
		return { ...e, createdAt: now, startAt, endAt, updatedAt: null };
	});
	await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
}

export async function insertRecurrenceRules(data: SampleRecurrenceRule[]) {
	if (!data.length) return;
	const now = new Date();
	const oneYear = new Date();
	oneYear.setFullYear(now.getFullYear() + 1);
	const until = toICalendarUntil(oneYear);

	const rules = data.map((rule, i) => {
		const required = ["id", "baseRecurringEventId", "creatorId", "organizationId"];
		for (const f of required) if (!rule[f]) throw new Error(`Missing required field: ${f}`);

		const freq = (rule.frequency === "DYNAMIC" ? "WEEKLY" : rule.frequency) as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
		if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) throw new Error(`Invalid frequency: ${freq}`);

		const int = rule.interval === "DYNAMIC" ? 1 : Number.parseInt(String(rule.interval), 10);
		if (Number.isNaN(int) || int <= 0) throw new Error(`Invalid interval: ${rule.interval}`);

		const validDays = ['MO','TU','WE','TH','FR','SA','SU'];
		const bd = rule.byDay || null;
		const byDayArray = bd
			? (Array.isArray(bd) ? bd : String(bd).split(",")).map((s: string) => {
				const trimmed = s.trim();
				const code = trimmed.replace(/^[+-]?\d+/, "");
				if (!validDays.includes(code)) throw new Error(`Invalid byDay: ${trimmed}`);
				return trimmed;
			}).filter(Boolean)
			: null;

		const byDayString = byDayArray && byDayArray.length > 0 
			? `;BYDAY=${byDayArray.map(d => d.replace(/^[+-]?\d+/, "")).join(",")}` 
			: "";

		const start = new Date(now);
		start.setDate(now.getDate() + i + 1);

		return {
			...rule,
			frequency: freq,
			interval: int,
			byDay: byDayArray,
			latestInstanceDate: now,
			createdAt: now,
			updatedAt: now,
			recurrenceStartDate: start,
			recurrenceEndDate: oneYear,
			recurrenceRuleString: `FREQ=${freq};INTERVAL=${int}${byDayString};UNTIL=${until}`,
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

export async function insertEventAttendees(data: SampleEventAttendee[]) {
	const attendees = data.map((a) => {
		const pc = parseDate(a.createdAt);
		const pu = parseDate(a.updatedAt);
		const pci = parseDate(a.checkinTime);
		const pco = parseDate(a.checkoutTime);
		return { ...a, createdAt: pc, updatedAt: pu, checkinTime: pci, checkoutTime: pco };
	});
	await checkAndInsertData(schema.eventAttendeesTable, attendees, schema.eventAttendeesTable.id, 1000);
}

type HandlerMap = {
	users: (data: SampleUser[]) => Promise<void>;
	organizations: (data: SampleOrganization[]) => Promise<void>;
	events: (data: SampleEvent[]) => Promise<void>;
	recurring_events: (data: SampleEvent[]) => Promise<void>;
	recurrence_rules: (data: SampleRecurrenceRule[]) => Promise<void>;
	event_attendees: (data: SampleEventAttendee[]) => Promise<void>;
};

export async function insertCollections(inputCollections: string[], autoIncludeEventAttendees = true): Promise<boolean> {
	try {
		const collections = [...inputCollections];
		if (autoIncludeEventAttendees && !collections.includes("event_attendees")) {
			collections.push("event_attendees");
		}

		const handlers: HandlerMap = {
			users: insertUsers,
			organizations: insertOrganizations,
			events: insertEvents,
			recurring_events: insertRecurringEvents,
			recurrence_rules: insertRecurrenceRules,
			event_attendees: insertEventAttendees,
		};

		for (const col of collections) {
			if (!(col in handlers)) {
				console.warn(`insertCollections: No handler for '${col}'. Skipping.`);
				continue;
			}
			const dataPath = path.resolve(dirname, `./sample_data/${col}.json`);
			try {
				const content = await fs.readFile(dataPath, "utf8");
				const parsed = JSON.parse(content);
				await handlers[col as keyof HandlerMap](Array.isArray(parsed) ? parsed : [parsed]);
			} catch (e) {
				if (col === "event_attendees") continue;
				throw new Error(`Failed to load ${col}`, { cause: e });
			}
		}

		await checkDataSize("After");
		return true;
	} catch (err) {
		if (err instanceof Error) throw err;
		throw new Error("Error adding data", { cause: err });
	}
}

export async function checkDataSize(stage: string): Promise<boolean> {
	try {
		const tables = [
			{ name: "users", table: schema.usersTable },
			{ name: "organizations", table: schema.organizationsTable },
			{ name: "events", table: schema.eventsTable },
			{ name: "recurrence_rules", table: schema.recurrenceRulesTable },
			{ name: "event_attendees", table: schema.eventAttendeesTable },
		];
		console.log(`\nRecord Counts ${stage} Import:`);
		for (const { name, table } of tables) {
			const result = await db.select({ count: sql`count(*)` }).from(table);
			console.log(`| ${name.padEnd(28)}| ${Number(result?.[0]?.count ?? 0).toString().padEnd(15)}|`);
		}
		return true;
	} catch (err) {
		console.error("checkDataSize failed:", err);
		return false;
	}
}

export async function disconnect(): Promise<boolean> {
	try {
		await queryClient.end();
		return true;
	} catch (err) {
		if (err instanceof Error) throw err;
		throw new Error("Error disconnecting", { cause: err });
	}
}
