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
import { uuidv7 } from "uuidv7";

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
	if (!adminEmail) throw new Error("Missing adminEmail variable.");

	type TableRow = { tablename: string };
	const USERS_TABLE = "users";
    const DENY_LIST = new Set([USERS_TABLE, "__drizzle_migrations", "__drizzle_migrations_lock"]);

	try {
		await db.transaction(async (tx) => {
			const tables: TableRow[] = await tx.execute(sql`
		  SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`);
			const tableNames = tables
				.map((row) => row.tablename)
				.filter((name) => !DENY_LIST.has(name));

			if (tableNames.length > 0) {
				await tx.execute(sql`TRUNCATE TABLE ${sql.join(
					tableNames.map((table) => sql.identifier(table)),
					sql`, `,
				)} RESTART IDENTITY CASCADE;`);
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
        const BATCH_SIZE = 1000;
        const stream = minioClient.listObjects(bucketName, "", true);

        for await (const obj of stream) {
            objectsToDelete.push(obj.name);
            if (objectsToDelete.length >= BATCH_SIZE) {
                await minioClient.removeObjects(bucketName, [...objectsToDelete]);
                objectsToDelete.length = 0;
            }
        }

        if (objectsToDelete.length > 0) {
            await minioClient.removeObjects(bucketName, objectsToDelete);
        }
		return true;
	} catch (error: unknown) {
        console.error("Error emptying bucket:", error);
		return false;
	}
}

export async function listSampleData(): Promise<boolean> {
    try {
        const sampleDataPath = path.resolve(dirname, "./sample_data");
        const files = await fs.readdir(sampleDataPath);
        console.log("\nSample Data Files:");
        console.log(`${"| File Name".padEnd(30)}| Document Count |`);
        console.log(`${"|".padEnd(30, "-")}|----------------|`);

        let errorsFound = false;

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const filePath = path.resolve(sampleDataPath, file);
            const content = await fs.readFile(filePath, "utf8");
            try {
                const docs = JSON.parse(content);
                if (!Array.isArray(docs)) {
                    console.log(`| ${file.padEnd(28)}| ${"Invalid (Not Array)".padEnd(15)}|`);
                    errorsFound = true;
                } else {
                    console.log(`| ${file.padEnd(28)}| ${docs.length.toString().padEnd(15)}|`);
                }
            } catch (e) {
                console.log(`| ${file.padEnd(28)}| ${"Invalid JSON".padEnd(15)}|`);
                errorsFound = true;
            }
        }
        return !errorsFound;
    } catch (error) {
        console.error("listSampleData failed:", error);
        return false;
    }
}

export async function pingDB(): Promise<boolean> {
	try {
		await db.execute(sql`SELECT 1`);
	} catch (error) {
		throw new Error("Unable to connect to the database.");
	}
	return true;
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
			await tx.insert(table).values(batch).onConflictDoNothing({
				target: Array.isArray(conflictTarget) ? conflictTarget : [conflictTarget],
			});
		}
	});
	return true;
}

export function parseDate(date: string | number | Date): Date | null {
	const parsedDate = new Date(date);
	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

// --- Handler Functions ---

async function insertUsers(data: any[]) {
	const users = data.map((user: any) => {
        const { createdAt, updatedAt, ...rest } = user;
        const parsedCreatedAt = parseDate(createdAt);
        const parsedUpdatedAt = parseDate(updatedAt);
        
        return {
            ...rest,
            // Fix: Conditional spread for both timestamps to handle nulls cleanly
            ...(parsedCreatedAt && { createdAt: parsedCreatedAt }),
            ...(parsedUpdatedAt && { updatedAt: parsedUpdatedAt }),
        };
    });
	await checkAndInsertData(schema.usersTable, users, schema.usersTable.id, 1000);
	console.log(`Added: Users`);
}

async function insertOrganizations(data: any[]) {
    const adminEmail = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
    if (!adminEmail) throw new Error("API_ADMINISTRATOR_USER_EMAIL_ADDRESS is not defined.");

	const organizations = data.map((org: any) => ({
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
		const memberships = organizations.map((org: any) => ({
			organizationId: org.id,
			memberId: adminUser.id,
			creatorId: adminUser.id,
			createdAt: new Date(),
			role: "administrator",
		}));
		await checkAndInsertData(schema.organizationMembershipsTable, memberships, [schema.organizationMembershipsTable.organizationId, schema.organizationMembershipsTable.memberId], 1000);
	} else {
        // Fix: Log warning if admin user not found
        console.warn(`Admin user (${adminEmail}) not found. Skipping organization memberships.`);
    }
	console.log(`Added: Organizations`);
}

async function insertEvents(data: any[]) {
    const now = new Date();
	const events = data.map((event: any, index: number) => {
		const start = new Date(now);
		start.setDate(now.getDate() + index);
		return { ...event, createdAt: start, startAt: start, endAt: new Date(start.getTime() + 2 * MS_PER_DAY), updatedAt: null };
	});
	await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
	console.log(`Added: Events`);
}

async function insertRecurringEvents(data: any[]) {
    const seedNow = new Date();
	const events = data.map((event: any, index: number) => {
        const startAt = new Date(seedNow);
        startAt.setDate(seedNow.getDate() + index + 1);
        
        const hourOffset = 9 + (index % 5);
        startAt.setHours(hourOffset, 0, 0, 0);
        
        const endAt = new Date(startAt);
        endAt.setHours(hourOffset + 1, 0, 0, 0);
        
        return {
            ...event,
            createdAt: seedNow,
            startAt,
            endAt,
            updatedAt: null,
        };
    });
	await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
	console.log(`Added: Recurring Events`);
}

async function insertRecurrenceRules(data: any[]) {
    if (!data.length) return;

	const now = new Date();
	const oneYear = new Date();
	oneYear.setFullYear(now.getFullYear() + 1);
	const until = oneYear.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

	const rules = data.map((rule: any) => {
        const requiredFields = ["id", "baseRecurringEventId", "creatorId", "organizationId"];
        for (const field of requiredFields) {
            if (!rule[field]) {
                throw new Error(`Missing required field: ${field} in rule ${rule.id || 'unknown'}`);
            }
        }

		const freq = rule.frequency === "DYNAMIC" ? "WEEKLY" : rule.frequency;
        const validFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
        if (!validFrequencies.includes(freq)) throw new Error(`Invalid frequency: ${freq}`);

        const intRaw = rule.interval === "DYNAMIC" ? 1 : rule.interval;
        const int = typeof intRaw === "number" ? intRaw : Number.parseInt(String(intRaw), 10);
        if (!Number.isFinite(int) || int <= 0) throw new Error(`Invalid interval: ${rule.interval}`);

		const bd = rule.byDay || null;
        const byDayArray = bd 
            ? (Array.isArray(bd) ? bd : String(bd).split(",")).map((s: string) => s.trim()).filter(Boolean) 
            : null;

        if (byDayArray && byDayArray.length > 0) {
            const validDays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
            for (const day of byDayArray) {
                const cleanDay = day.replace(/^[+-]?\d+/, "").trim();
                if (!validDays.includes(cleanDay)) throw new Error(`Invalid byDay value: ${day}`);
            }
        }

        const byDayString = (byDayArray && byDayArray.length > 0) ? `;BYDAY=${byDayArray.join(",")}` : "";

		return {
			id: rule.id,
			baseRecurringEventId: rule.baseRecurringEventId,
			creatorId: rule.creatorId,
			updaterId: rule.updaterId,
			organizationId: rule.organizationId,
			frequency: freq,
			interval: int,
			byDay: (byDayArray && byDayArray.length > 0) ? byDayArray : null, 
			latestInstanceDate: now,
			createdAt: now,
			updatedAt: now,
			recurrenceStartDate: now,
			recurrenceEndDate: oneYear,
			recurrenceRuleString: `FREQ=${freq};INTERVAL=${int}${byDayString};UNTIL=${until}`,
			count: null, originalSeriesId: null, byMonth: null, byMonthDay: null
		};
	});

	await db.insert(schema.recurrenceRulesTable).values(rules).onConflictDoUpdate({
		target: schema.recurrenceRulesTable.id,
		set: {
            frequency: sql`excluded.frequency`,
            interval: sql`excluded.interval`,
            byDay: sql`excluded.by_day`,
			recurrenceEndDate: sql`excluded.recurrence_end_date`,
			recurrenceRuleString: sql`excluded.recurrence_rule_string`,
			latestInstanceDate: sql`excluded.latest_instance_date`,
			updatedAt: now
		}
	});
	console.log(`Added: Recurrence Rules`);
}

async function insertEventAttendees(data: any[]) {
    const attendees = data.map((attendee: any) => {
        const parsedCreatedAt = parseDate(attendee.createdAt);
        const parsedUpdatedAt = parseDate(attendee.updatedAt);
        const parsedCheckin = parseDate(attendee.checkinTime);
        const parsedCheckout = parseDate(attendee.checkoutTime);

        return {
            ...attendee,
            // Fix: Conditional spread for all date fields
            ...(parsedCreatedAt && { createdAt: parsedCreatedAt }),
            ...(parsedUpdatedAt && { updatedAt: parsedUpdatedAt }),
            ...(parsedCheckin && { checkinTime: parsedCheckin }),
            ...(parsedCheckout && { checkoutTime: parsedCheckout }),
        };
    });
    await checkAndInsertData(schema.eventAttendeesTable, attendees, schema.eventAttendeesTable.id, 1000);
    console.log(`Added: Event Attendees`);
}

export async function insertCollections(
    inputCollections: string[], 
    autoIncludeEventAttendees: boolean = true
): Promise<boolean> {
	try {
		const API_ADMINISTRATOR_USER_EMAIL_ADDRESS = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
		if (!API_ADMINISTRATOR_USER_EMAIL_ADDRESS) throw new Error("API_ADMINISTRATOR_USER_EMAIL_ADDRESS is not defined.");

        const collections = [...inputCollections];
        if (autoIncludeEventAttendees && !collections.includes("event_attendees")) {
            collections.push("event_attendees");
            console.log("Note: Automatically including event_attendees collection");
        }

        const collectionHandlers: Record<string, (data: any[]) => Promise<void>> = {
            users: insertUsers,
            organizations: insertOrganizations,
            events: insertEvents,
            recurring_events: insertRecurringEvents,
            recurrence_rules: insertRecurrenceRules,
            event_attendees: insertEventAttendees,
        };

        const optionalCollections = ["event_attendees"];

		for (const collection of collections) {
            if (!collectionHandlers[collection]) {
                console.warn(`Skipping unknown collection: ${collection}`);
                continue;
            }

			const dataPath = path.resolve(dirname, `./sample_data/${collection}.json`);
			let fileContent = "[]";
			try {
				fileContent = await fs.readFile(dataPath, "utf8");
			} catch (e) {
                if (optionalCollections.includes(collection)) {
                    console.log(`Skipping optional file: ${collection}.json`);
				    continue;
                } else {
                    console.error(`Failed to read required file: ${dataPath}`, e);
                    throw e;
                }
			}

            let parsedData;
            try {
                parsedData = JSON.parse(fileContent);
                if (!Array.isArray(parsedData)) {
                    // Fix: Log warning when wrapping non-array data
                    console.warn(`Warning: ${collection}.json contains non-array data, wrapping in array`);
                    parsedData = [parsedData];
                }
            } catch (e) {
                if (optionalCollections.includes(collection)) {
                    console.warn(`Skipping malformed optional collection: ${collection}`);
                    continue;
                }
                throw new Error(`Malformed JSON in required collection: ${collection}`);
            }

            const handler = collectionHandlers[collection];
            await handler(parsedData);
		}

		await checkDataSize("After");
        return true;
	} catch (err) {
		throw new Error(`Error adding data: ${err}`);
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
            // Fix: Added missing table check
            { name: "organization_memberships", table: schema.organizationMembershipsTable },
        ];

        console.log(`\nRecord Counts ${stage} Import:\n`);
        console.log(`${"| Table Name".padEnd(30)}| Record Count |`);
        console.log(`${"|".padEnd(30, "-")}|----------------|`);

        for (const { name, table } of tables) {
            const result = await db.select({ count: sql`count(*)` }).from(table);
            const count = Number(result?.[0]?.count ?? 0);
            console.log(`| ${name.padEnd(28)}| ${count.toString().padEnd(15)}|`);
        }
        return true;
    } catch (err) {
        console.error(`Error checking size: ${err}`);
        return false;
    }
}

export async function disconnect(): Promise<boolean> {
	try {
		await queryClient.end();
	} catch (err) {
		throw new Error(`Error disconnecting: ${err}`);
	}
	return true;
}
