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

/**
 * Prompts the user for confirmation using the built-in readline module.
 */
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

/**
 * Clears all tables in the database.
 */
export async function formatDatabase(): Promise<boolean> {
	const adminEmail = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	if (!adminEmail) throw new Error("Missing adminEmail variable.");

	type TableRow = { tablename: string };
	const USERS_TABLE = "users";
	try {
		await db.transaction(async (tx) => {
			const tables: TableRow[] = await tx.execute(sql`
		  SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`);
			const tableNames = tables
				.map((row) => row.tablename)
				.filter((name) => name !== USERS_TABLE);

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
		const objectsList: string[] = await new Promise<string[]>((resolve, reject) => {
			const objects: string[] = [];
			const stream = minioClient.listObjects(bucketName, "", true);
			stream.on("data", (obj: { name: string }) => objects.push(obj.name));
			stream.on("error", (err: Error) => reject(err));
			stream.on("end", () => resolve(objects));
		});
		if (objectsList.length > 0) {
			await minioClient.removeObjects(bucketName, objectsList);
		}
		return true;
	} catch (error: unknown) {
        console.error("Error emptying bucket:", error);
		return false;
	}
}

/**
 * Lists all sample data files in the sample_data directory with their document counts.
 * Displays results in a formatted table showing file names and document counts.
 * @returns Promise that resolves to true if listing succeeds, false otherwise
 */
export async function listSampleData(): Promise<boolean> {
    try {
        const sampleDataPath = path.resolve(dirname, "./sample_data");
        const files = await fs.readdir(sampleDataPath);
        console.log("\nSample Data Files:");
        console.log(`${"| File Name".padEnd(30)}| Document Count |`);
        console.log(`${"|".padEnd(30, "-")}|----------------|`);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const filePath = path.resolve(sampleDataPath, file);
            const content = await fs.readFile(filePath, "utf8");
            try {
                const docs = JSON.parse(content);
                const count = Array.isArray(docs) ? docs.length : 1;
                console.log(`| ${file.padEnd(28)}| ${count.toString().padEnd(15)}|`);
            } catch (e) {
                console.log(`| ${file.padEnd(28)}| ${"Invalid JSON".padEnd(15)}|`);
            }
        }
        return true;
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

/**
 * Parses a date string and returns a Date object. Returns null if the date is invalid.
 * @param date - The date string to parse
 * @returns The parsed Date object or null
 */
export function parseDate(date: string | number | Date): Date | null {
	const parsedDate = new Date(date);
	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

// --- Handler Functions (Refactored per CodeRabbit) ---

async function insertUsers(data: any[]) {
	const users = data.map((user: any) => ({
		...user,
		createdAt: parseDate(user.createdAt),
		updatedAt: parseDate(user.updatedAt),
	}));
	await checkAndInsertData(schema.usersTable, users, schema.usersTable.id, 1000);
	console.log(`Added: Users`);
}

async function insertOrganizations(data: any[]) {
    const API_ADMINISTRATOR_USER_EMAIL_ADDRESS = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	const organizations = data.map((org: any) => ({
		...org,
		createdAt: parseDate(org.createdAt),
		updatedAt: parseDate(org.updatedAt),
	}));
	await checkAndInsertData(schema.organizationsTable, organizations, schema.organizationsTable.id, 1000);
	
	const adminUser = await db.query.usersTable.findFirst({
		columns: { id: true },
		where: (fields, operators) => operators.eq(fields.emailAddress, API_ADMINISTRATOR_USER_EMAIL_ADDRESS!),
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
	}
	console.log(`Added: Organizations`);
}

async function insertEvents(data: any[]) {
    const now = new Date();
	const events = data.map((event: any, index: number) => {
		const start = new Date(now);
		start.setDate(now.getDate() + index);
		return { ...event, createdAt: start, startAt: start, endAt: new Date(start.getTime() + 2 * 86400000), updatedAt: null };
	});
	await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
	console.log(`Added: Events`);
}

async function insertRecurringEvents(data: any[]) {
	const events = data.map((event: any) => {
        // Fix: Create fresh Date objects to avoid mutation bugs
        const now = new Date();
        const startAt = new Date(now);
        startAt.setHours(10, 0, 0, 0);
        const endAt = new Date(now);
        endAt.setHours(11, 0, 0, 0);
        
        return {
            ...event,
            createdAt: now,
            startAt,
            endAt,
            updatedAt: null,
        };
    });
	await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
	console.log(`Added: Recurring Events`);
}

async function insertRecurrenceRules(data: any[]) {
	const now = new Date();
	const oneYear = new Date();
	oneYear.setFullYear(now.getFullYear() + 1);
	const until = oneYear.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

	const rules = data.map((rule: any) => {
		const freq = rule.frequency === "DYNAMIC" ? "WEEKLY" : rule.frequency;
        
        // Validate Frequency Enum
        const validFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
        if (!validFrequencies.includes(freq)) {
            throw new Error(`Invalid frequency: ${freq}`);
        }

		const int = rule.interval === "DYNAMIC" ? 1 : rule.interval;
		const bd = rule.byDay || null;
        
        // Fix: Safe array splitting and validation
        const byDayArray = bd ? (Array.isArray(bd) ? bd : bd.split(",")) : null;

        if (byDayArray) {
            const validDays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
            for (const day of byDayArray) {
                // Allow iCal format (e.g. 1MO, -2FR)
                const cleanDay = day.replace(/^[+-]?\d+/, "").trim();
                if (!validDays.includes(cleanDay)) {
                    throw new Error(`Invalid byDay value: ${day}`);
                }
            }
        }

        const byDayString = byDayArray ? `;BYDAY=${byDayArray.join(",")}` : "";

		return {
			id: rule.id,
			baseRecurringEventId: rule.baseRecurringEventId,
			creatorId: rule.creatorId,
			updaterId: rule.updaterId,
			organizationId: rule.organizationId,
			frequency: freq,
			interval: int,
			byDay: byDayArray, 
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
			recurrenceEndDate: sql`excluded.recurrence_end_date`,
			recurrenceRuleString: sql`excluded.recurrence_rule_string`,
			latestInstanceDate: sql`excluded.latest_instance_date`,
			updatedAt: now
		}
	});
	console.log(`Added: Recurrence Rules`);
}

async function insertEventAttendees(data: any[]) {
    const attendees = data.map((attendee: any) => ({
        ...attendee,
        createdAt: parseDate(attendee.createdAt),
        updatedAt: parseDate(attendee.updatedAt),
        checkinTime: parseDate(attendee.checkinTime),
        checkoutTime: parseDate(attendee.checkoutTime),
    }));
    await checkAndInsertData(schema.eventAttendeesTable, attendees, schema.eventAttendeesTable.id, 1000);
    console.log(`Added: Event Attendees`);
}

/**
 * Inserts sample data collections into the database.
 * @param inputCollections - Array of collection names to insert. event_attendees is automatically included if not present.
 * @returns Promise that resolves to true if insertion succeeds
 */
export async function insertCollections(inputCollections: string[]): Promise<boolean> {
	try {
		const API_ADMINISTRATOR_USER_EMAIL_ADDRESS = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
		if (!API_ADMINISTRATOR_USER_EMAIL_ADDRESS) throw new Error("API_ADMINISTRATOR_USER_EMAIL_ADDRESS is not defined.");

        // Fix: Avoid mutation of input param
        const collections = inputCollections.includes("event_attendees") 
            ? [...inputCollections] 
            : [...inputCollections, "event_attendees"];

        const collectionHandlers: Record<string, (data: any[]) => Promise<void>> = {
            users: insertUsers,
            organizations: insertOrganizations,
            events: insertEvents,
            recurring_events: insertRecurringEvents,
            recurrence_rules: insertRecurrenceRules,
            event_attendees: insertEventAttendees,
            // Add other simple handlers if needed or handle in default
        };

		for (const collection of collections) {
			const dataPath = path.resolve(dirname, `./sample_data/${collection}.json`);
			let fileContent = "[]";
			try {
				fileContent = await fs.readFile(dataPath, "utf8");
			} catch (e) {
                // Silently skip missing files as they might be optional
				continue;
			}

            let parsedData;
            try {
                parsedData = JSON.parse(fileContent);
                if (!Array.isArray(parsedData)) parsedData = [parsedData];
            } catch (e) {
                console.warn(`Skipping malformed collection: ${collection}`);
                continue;
            }

            const handler = collectionHandlers[collection];
            if (handler) {
                await handler(parsedData);
            } else {
                // Fallback for simple tables not needing special logic
                // For Phase 1 we only strictly support the defined handlers
                console.warn(`Skipping unknown collection: ${collection}`);
            }
		}

		await checkDataSize("After");
        return true;
	} catch (err) {
		throw new Error(`Error adding data: ${err}`);
	}
}

/**
 * Checks and displays record counts for key tables.
 * Useful for verifying data before and after seeding operations.
 * @param stage - Label for the current stage (e.g., "Before", "After")
 * @returns Promise that resolves to true if check succeeds, false otherwise
 */
export async function checkDataSize(stage: string): Promise<boolean> {
    try {
        const tables = [
            { name: "users", table: schema.usersTable },
            { name: "organizations", table: schema.organizationsTable },
            { name: "events", table: schema.eventsTable },
            { name: "recurrence_rules", table: schema.recurrenceRulesTable },
        ];

        console.log(`\nRecord Counts ${stage} Import:\n`);
        console.log(`${"| Table Name".padEnd(30)}| Record Count |`);
        console.log(`${"|".padEnd(30, "-")}|----------------|`);

        for (const { name, table } of tables) {
            const result = await db.select({ count: sql<number>`count(*)` }).from(table);
            const count = result?.[0]?.count ?? 0;
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
