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
		return false;
	}
}

export async function listSampleData(): Promise<boolean> {
	return true; 
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

export async function insertCollections(collections: string[]): Promise<boolean> {
	try {
		const API_ADMINISTRATOR_USER_EMAIL_ADDRESS = envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
		if (!API_ADMINISTRATOR_USER_EMAIL_ADDRESS) throw new Error("API_ADMINISTRATOR_USER_EMAIL_ADDRESS is not defined.");

		// Ensure event_attendees is in the list of collections to process if not already
		if (!collections.includes("event_attendees")) {
			collections.push("event_attendees");
		}

		for (const collection of collections) {
			const dataPath = path.resolve(dirname, `./sample_data/${collection}.json`);
			
			// Gracefully handle missing files
			let fileContent = "[]";
			try {
				fileContent = await fs.readFile(dataPath, "utf8");
			} catch (e) {
				console.log(`Skipping optional file: ${collection}.json`);
				continue;
			}

			switch (collection) {
				case "users": {
					const users = JSON.parse(fileContent).map((user: any) => ({
						...user,
						createdAt: parseDate(user.createdAt),
						updatedAt: parseDate(user.updatedAt),
					}));
					await checkAndInsertData(schema.usersTable, users, schema.usersTable.id, 1000);
					console.log(`Added: Users`);
					break;
				}
				case "organizations": {
					const organizations = JSON.parse(fileContent).map((org: any) => ({
						...org,
						createdAt: parseDate(org.createdAt),
						updatedAt: parseDate(org.updatedAt),
					}));
					await checkAndInsertData(schema.organizationsTable, organizations, schema.organizationsTable.id, 1000);
					
					const API_ADMINISTRATOR_USER = await db.query.usersTable.findFirst({
						columns: { id: true },
						where: (fields, operators) => operators.eq(fields.emailAddress, API_ADMINISTRATOR_USER_EMAIL_ADDRESS),
					});
					if (API_ADMINISTRATOR_USER) {
						const memberships = organizations.map((org: any) => ({
							organizationId: org.id,
							memberId: API_ADMINISTRATOR_USER.id,
							creatorId: API_ADMINISTRATOR_USER.id,
							createdAt: new Date(),
							role: "administrator",
						}));
						await checkAndInsertData(schema.organizationMembershipsTable, memberships, [schema.organizationMembershipsTable.organizationId, schema.organizationMembershipsTable.memberId], 1000);
					}
					console.log(`Added: Organizations`);
					break;
				}
				case "events": {
					const now = new Date();
					const events = JSON.parse(fileContent).map((event: any, index: number) => {
						const start = new Date(now);
						start.setDate(now.getDate() + index);
						return { ...event, createdAt: start, startAt: start, endAt: new Date(start.getTime() + 2 * 86400000), updatedAt: null };
					});
					await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
					console.log(`Added: Events`);
					break;
				}
				case "recurring_events": {
					const now = new Date();
					const events = JSON.parse(fileContent).map((event: any) => ({
						...event,
						createdAt: now,
						startAt: new Date(now.setHours(10, 0, 0, 0)),
						endAt: new Date(now.setHours(11, 0, 0, 0)),
						updatedAt: null,
					}));
					await checkAndInsertData(schema.eventsTable, events, schema.eventsTable.id, 1000);
					console.log(`Added: Recurring Events`);
					break;
				}
				case "recurrence_rules": {
					const now = new Date();
					const oneYear = new Date();
					oneYear.setFullYear(now.getFullYear() + 1);
					const until = oneYear.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
					
					let parsed = JSON.parse(fileContent);
					if (!Array.isArray(parsed)) parsed = [parsed];

					const rules = parsed.map((rule: any) => {
						const freq = rule.frequency === "DYNAMIC" ? "WEEKLY" : rule.frequency;
						const int = rule.interval === "DYNAMIC" ? 1 : rule.interval;
						const bd = rule.byDay || null;
                        
                        // Fix for Array type
                        const byDayArray = bd ? bd.split(",") : null;

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
							recurrenceRuleString: `FREQ=${freq};INTERVAL=${int}${bd ? `;BYDAY=${bd}` : ""};UNTIL=${until}`,
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
					break;
				}
                // 🟢 NEW: Added Infrastructure for Event Attendees (Phase 1 Requirement)
                case "event_attendees": {
                    const attendees = JSON.parse(fileContent).map((attendee: any) => ({
                        ...attendee,
                        createdAt: parseDate(attendee.createdAt),
                        updatedAt: parseDate(attendee.updatedAt),
                        checkinTime: parseDate(attendee.checkinTime),
                        checkoutTime: parseDate(attendee.checkoutTime),
                    }));
                    await checkAndInsertData(schema.eventAttendeesTable, attendees, schema.eventAttendeesTable.id, 1000);
                    console.log(`Added: Event Attendees`);
                    break;
                }
				default: {
					// Fallback for simple tables
                    try {
                        const data = JSON.parse(fileContent);
                        if (Array.isArray(data) && data.length > 0) {
                             // Placeholder for other tables
                        }
                    } catch (e) {}
					break;
				}
			}
		}
	} catch (err) {
		throw new Error(`Error adding data: ${err}`);
	}
	return true;
}

export function parseDate(date: string | number | Date): Date | null {
	const parsedDate = new Date(date);
	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export async function checkDataSize(stage: string): Promise<boolean> {
	return true; 
}

export async function disconnect(): Promise<boolean> {
	try {
		await queryClient.end();
	} catch (err) {
		throw new Error(`Error disconnecting: ${err}`);
	}
	return true;
}
