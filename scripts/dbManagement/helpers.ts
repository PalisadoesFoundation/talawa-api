import { createHash } from "node:crypto";
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

// Get the directory name of the current module
export const dirname: string = path.dirname(fileURLToPath(import.meta.url));
export const bucketName: string = envConfig.MINIO_ROOT_USER || "";
// Create a new database client
export const queryClient = postgres({
	host: envConfig.API_POSTGRES_HOST,
	port: Number(envConfig.API_POSTGRES_PORT) || 5432,
	database: envConfig.API_POSTGRES_DATABASE || "",
	username: envConfig.API_POSTGRES_USER || "",
	password: envConfig.API_POSTGRES_PASSWORD || "",
	ssl: envConfig.API_POSTGRES_SSL_MODE === "allow",
});

//Create a bucket client
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

	if (!adminEmail) {
		throw new Error(
			"Missing adminEmail environment variable. Aborting to prevent accidental deletion of all users.",
		);
	}

	type TableRow = { tablename: string };
	const USERS_TABLE = "users";
	try {
		await db.transaction(async (tx) => {
			const tables: TableRow[] = await tx.execute(sql`
		  SELECT tablename FROM pg_catalog.pg_tables
		  WHERE schemaname = 'public'
		`);
			const tableNames = tables
				.map((row) => row.tablename)
				.filter((name) => name !== USERS_TABLE);

			if (tableNames.length > 0) {
				await tx.execute(sql`
			TRUNCATE TABLE ${sql.join(
				tableNames.map((table) => sql.identifier(table)),
				sql`, `,
			)}
			RESTART IDENTITY CASCADE;
		  `);
			}

			await tx.execute(sql`
				DELETE FROM ${sql.identifier(USERS_TABLE)}
				WHERE email_address != ${adminEmail};
			  `);
		});

		return true;
	} catch (error: unknown) {
		console.error("Error formatting database:", error);
		return false;
	}
}

export async function emptyMinioBucket(): Promise<boolean> {
	try {
		// List all objects in the bucket.
		const objectsList: string[] = await new Promise<string[]>(
			(resolve, reject) => {
				const objects: string[] = [];
				const stream = minioClient.listObjects(bucketName, "", true);
				stream.on("data", (obj: { name: string }) => {
					objects.push(obj.name);
				});
				stream.on("error", (err: Error) => {
					console.error("Error listing objects in bucket:", err);
					reject(err);
				});
				stream.on("end", () => resolve(objects));
			},
		);

		// If there are objects, remove them all using removeObjects.
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
 * Check database connection
 */

export async function pingDB(): Promise<boolean> {
	try {
		await db.execute(sql`SELECT 1`);
	} catch (_error) {
		throw new Error("Unable to connect to the database.");
	}
	return true;
}

/**
 * Check duplicate data
 */

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
			await tx
				.insert(table)
				.values(batch)
				.onConflictDoNothing({
					target: Array.isArray(conflictTarget)
						? conflictTarget
						: [conflictTarget],
				});
		}
	});
	return true;
}

/**
 * Inserts data into specified tables.
 * @param collections - Array of collection/table names to insert data into
 * @param options - Options for loading data
 */

export async function insertCollections(
	collections: string[],
): Promise<boolean> {
	try {
		await checkDataSize("Before");

		const API_ADMINISTRATOR_USER_EMAIL_ADDRESS =
			envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;

		if (!API_ADMINISTRATOR_USER_EMAIL_ADDRESS) {
			throw new Error(
				"\x1b[31mAPI_ADMINISTRATOR_USER_EMAIL_ADDRESS is not defined.\x1b[0m",
			);
		}

		for (const collection of collections) {
			const dataPath = path.resolve(
				dirname,
				`./sample_data/${collection}.json`,
			);
			const fileContent = await fs.readFile(dataPath, "utf8");

			switch (collection) {
				case "users": {
					const users = JSON.parse(fileContent).map(
						(user: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
							birthDate: string | number | Date;
							lockedUntil: string | number | Date | null;
							lastFailedLoginAt?: string | number | Date | null;
						}) => ({
							...user,
							createdAt: user.createdAt ? parseDate(user.createdAt) : null,
							updatedAt: user.updatedAt ? parseDate(user.updatedAt) : null,
							birthDate: user.birthDate ? parseDate(user.birthDate) : null,
							lockedUntil: user.lockedUntil
								? parseDate(user.lockedUntil)
								: null,
							lastFailedLoginAt: user.lastFailedLoginAt
								? parseDate(user.lastFailedLoginAt)
								: null,
						}),
					) as (typeof schema.usersTable.$inferInsert)[];

					await checkAndInsertData(
						schema.usersTable,
						users,
						schema.usersTable.id,
						1000,
					);

					console.log(
						"\n\x1b[35mAdded: Users table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "organizations": {
					const organizations = JSON.parse(fileContent).map(
						(org: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
						}) => ({
							...org,
							createdAt: parseDate(org.createdAt),
							updatedAt: parseDate(org.updatedAt),
						}),
					) as (typeof schema.organizationsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.organizationsTable,
						organizations,
						schema.organizationsTable.id,
						1000,
					);

					const API_ADMINISTRATOR_USER = await db.query.usersTable.findFirst({
						columns: {
							id: true,
						},
						where: (fields, operators) =>
							operators.eq(
								fields.emailAddress,
								API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							),
					});
					if (!API_ADMINISTRATOR_USER) {
						throw new Error(
							"\x1b[31mAPI_ADMINISTRATOR_USER_EMAIL_ADDRESS is not found in users table\x1b[0m",
						);
					}

					const organizationAdminMembership = organizations.map((org) => ({
						organizationId: org.id,
						memberId: API_ADMINISTRATOR_USER.id,
						creatorId: API_ADMINISTRATOR_USER.id,
						createdAt: new Date(),
						role: "administrator",
					})) as (typeof schema.organizationMembershipsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.organizationMembershipsTable,
						organizationAdminMembership,
						[
							schema.organizationMembershipsTable.organizationId,
							schema.organizationMembershipsTable.memberId,
						],
						1000,
					);

					console.log(
						"\x1b[35mAdded: Organizations table data (skipping duplicates), plus admin memberships\x1b[0m",
					);
					break;
				}

				case "organization_memberships": {
					const organizationMemberships = JSON.parse(fileContent).map(
						(membership: { createdAt: string | number | Date }) => ({
							...membership,
							createdAt: parseDate(membership.createdAt),
						}),
					) as (typeof schema.organizationMembershipsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.organizationMembershipsTable,
						organizationMemberships,
						[
							schema.organizationMembershipsTable.organizationId,
							schema.organizationMembershipsTable.memberId,
						],
						1000,
					);

					console.log(
						"\x1b[35mAdded: Organization_memberships data (skipping duplicates)\x1b[0m",
					);
					break;
				}
				case "posts": {
					const posts = JSON.parse(fileContent).map(
						(post: { createdAt: string | number | Date }) => ({
							...post,
							createdAt: parseDate(post.createdAt),
						}),
					) as (typeof schema.postsTable.$inferInsert)[];
					await checkAndInsertData(
						schema.postsTable,
						posts,
						schema.postsTable.id,
						1000,
					);
					console.log(
						"\x1b[35mAdded: Posts table data (skipping duplicates)\x1b[0m",
					);
					break;
				}
				case "post_votes": {
					const post_votes = JSON.parse(fileContent).map(
						(post_vote: { createdAt: string | number | Date }) => ({
							...post_vote,
							createdAt: parseDate(post_vote.createdAt),
						}),
					) as (typeof schema.postVotesTable.$inferInsert)[];
					await checkAndInsertData(
						schema.postVotesTable,
						post_votes,
						schema.postVotesTable.id,
						1000,
					);
					console.log(
						"\x1b[35mAdded: Post_votes table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "tag_folders": {
					const tag_folders = JSON.parse(fileContent).map(
						(tag_folders: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
						}) => ({
							...tag_folders,
							createdAt: parseDate(tag_folders.createdAt),
							updatedAt: parseDate(tag_folders.updatedAt),
						}),
					) as (typeof schema.tagFoldersTable.$inferInsert)[];
					await checkAndInsertData(
						schema.tagFoldersTable,
						tag_folders,
						schema.tagFoldersTable.id,
						100,
					);
					console.log(
						"\x1b[35mAdded: Tag Folders Table Data (skipping duplicates)\x1b[0m",
					);
					break;
				}
				case "tag_assignments": {
					const tag_assignments = JSON.parse(fileContent).map(
						(assignment: {
							tagId: string;
							assigneeId: string;
							creatorId: string;
							createdAt: string | number | Date;
						}) => ({
							tagId: assignment.tagId,
							assigneeId: assignment.assigneeId,
							creatorId: assignment.creatorId,
							createdAt: parseDate(assignment.createdAt),
						}),
					) as (typeof schema.tagAssignmentsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.tagAssignmentsTable,
						tag_assignments,
						[
							schema.tagAssignmentsTable.assigneeId,
							schema.tagAssignmentsTable.tagId,
						],
						100,
					);
					console.log(
						"\x1b[35mAdded: Tag Assignments Table Data (skipping duplicates)\x1b[0m",
					);
					break;
				}
				case "tags": {
					const tags = JSON.parse(fileContent).map(
						(tags: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
						}) => ({
							...tags,
							createdAt: parseDate(tags.createdAt),
							updatedAt: parseDate(tags.updatedAt),
						}),
					) as (typeof schema.tagsTable.$inferInsert)[];
					await checkAndInsertData(
						schema.tagsTable,
						tags,
						schema.tagsTable.id,
						100,
					);
					console.log(
						"\x1b[35mAdded: Tags Table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "membership_requests": {
					const membership_requests = JSON.parse(fileContent).map(
						(membership_request: { createdAt: string | number | Date }) => ({
							...membership_request,
							createdAt: parseDate(membership_request.createdAt),
						}),
					) as (typeof schema.membershipRequestsTable.$inferInsert)[];
					await checkAndInsertData(
						schema.membershipRequestsTable,
						membership_requests,
						[
							schema.membershipRequestsTable.userId,
							schema.membershipRequestsTable.organizationId,
						],
						1000,
					);
					console.log(
						"\x1b[35mAdded: Membership_requests table data (skipping duplicates)\x1b[0m",
					);
					break;
				}
				case "post_attachments": {
					const post_attachments = JSON.parse(fileContent).map(
						(post_attachment: { createdAt: string | number | Date }) => ({
							...post_attachment,
							createdAt: parseDate(post_attachment.createdAt),
						}),
					) as (typeof schema.postAttachmentsTable.$inferInsert)[];
					await checkAndInsertData(
						schema.postAttachmentsTable,
						post_attachments,
						schema.postAttachmentsTable.id,
						1000,
					);
					// Handle file uploads to Minio.
					await Promise.all(
						post_attachments.map(async (attachment) => {
							try {
								const fileExtension = attachment.mimeType.split("/").pop();
								const filePath = path.resolve(
									dirname,
									`./sample_data/images/${attachment.name}.${fileExtension}`,
								);
								const fileData = await fs.readFile(filePath);
								await minioClient.putObject(
									bucketName,
									attachment.objectName,
									fileData,
									undefined,
									{
										"content-type": attachment.mimeType,
									},
								);
							} catch (error) {
								console.error(
									`Failed to upload attachment ${attachment.name}:`,
									error,
								);
								throw error;
							}
						}),
					);
					console.log(
						"\x1b[35mAdded: Post_attachments table data and uploaded files (Duplicates Allowed)\x1b[0m",
					);
					break;
				}
				case "comments": {
					const comments = JSON.parse(fileContent).map(
						(comment: { createdAt: string | number | Date }) => ({
							...comment,
							createdAt: parseDate(comment.createdAt),
						}),
					) as (typeof schema.commentsTable.$inferInsert)[];
					await checkAndInsertData(
						schema.commentsTable,
						comments,
						schema.commentsTable.id,
						1000,
					);
					console.log(
						"\x1b[35mAdded: Comments table data (skipping duplicates)\x1b[0m",
					);
					break;
				}
				case "comment_votes": {
					const comment_votes = JSON.parse(fileContent).map(
						(comment_vote: { createdAt: string | number | Date }) => ({
							...comment_vote,
							createdAt: parseDate(comment_vote.createdAt),
						}),
					) as (typeof schema.commentVotesTable.$inferInsert)[];
					await checkAndInsertData(
						schema.commentVotesTable,
						comment_votes,
						schema.commentVotesTable.id,
						1000,
					);
					console.log(
						"\x1b[35mAdded: Comment_votes table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "events": {
					const now = new Date();
					const events = JSON.parse(fileContent).map(
						(
							event: {
								id: string;
								createdAt: string | number | Date;
								updatedAt: string | number | Date;
								startAt: string | number | Date | null;
								endAt: string | number | Date | null;
								startDate?: string;
								endDate?: string;
								allDay?: boolean;
							},
							index: number,
						) => {
							// For all-day events, generate fresh dates relative to now
							if (event.allDay) {
								const createdAt = new Date(
									Date.UTC(
										now.getUTCFullYear(),
										now.getUTCMonth(),
										now.getUTCDate() + index,
										1,
										0,
										0,
									),
								);

								// Generate startDate and endDate in YYYY-MM-DD format
								// For all-day events, we'll create single-day events
								const eventDate = new Date(
									Date.UTC(
										now.getUTCFullYear(),
										now.getUTCMonth(),
										now.getUTCDate() + index,
									),
								);
								const startDate = [
									eventDate.getUTCFullYear(),
									String(eventDate.getUTCMonth() + 1).padStart(2, "0"),
									String(eventDate.getUTCDate()).padStart(2, "0"),
								].join("-");

								// endDate is exclusive, so add 1 day
								const endDateObj = new Date(eventDate);
								endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
								const endDate = [
									endDateObj.getUTCFullYear(),
									String(endDateObj.getUTCMonth() + 1).padStart(2, "0"),
									String(endDateObj.getUTCDate()).padStart(2, "0"),
								].join("-");

								return {
									...event,
									createdAt,
									startAt: null,
									endAt: null,
									startDate,
									endDate,
									updatedAt: null,
								};
							}

							// For timed events, generate timestamps
							const start = new Date(
								now.getFullYear(),
								now.getMonth(),
								now.getDate() + index,
								9,
								0,
								0,
							);
							const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);

							return {
								...event,
								allDay: false,
								createdAt: start,
								startAt: start,
								endAt: end,
								startDate: null,
								endDate: null,
								updatedAt: null,
							};
						},
					) as (typeof schema.eventsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.eventsTable,
						events,
						schema.eventsTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Events table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "recurring_event_templates": {
					const now = new Date();
					const sourceTemplates = parseRecurringTemplates(fileContent);
					const organizations = await db
						.select({ id: schema.organizationsTable.id })
						.from(schema.organizationsTable);

					const templates = organizations.flatMap((organization) =>
						sourceTemplates.map((template) => {
							const deterministicTemplateId = deterministicUuid(
								`template:${organization.id}:${template.id}`,
							);
							const templateTiming = buildTemplateTimingFromSource(
								template,
								now,
							);
							const createdAt = parseDate(template.createdAt) ?? now;

							return {
								id: deterministicTemplateId,
								name: template.name,
								description: template.description,
								location: template.location,
								createdAt,
								updatedAt: null,
								updaterId: null,
								creatorId: template.creatorId,
								organizationId: organization.id,
								allDay: templateTiming.allDay,
								startAt: templateTiming.startAt,
								endAt: templateTiming.endAt,
								startDate: templateTiming.startDate,
								endDate: templateTiming.endDate,
								isPublic: template.isPublic,
								isInviteOnly: template.isInviteOnly,
								isRegisterable: template.isRegisterable,
								isRecurringEventTemplate: true,
							};
						}),
					) as (typeof schema.eventsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.eventsTable,
						templates,
						schema.eventsTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Recurring event templates (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "recurrence_rules": {
					const now = new Date();
					const sourceRules = parseRecurrenceRules(fileContent);
					const organizations = await db
						.select({ id: schema.organizationsTable.id })
						.from(schema.organizationsTable);

					const templates = await db
						.select({
							id: schema.eventsTable.id,
							allDay: schema.eventsTable.allDay,
							startAt: schema.eventsTable.startAt,
							endAt: schema.eventsTable.endAt,
							startDate: schema.eventsTable.startDate,
							endDate: schema.eventsTable.endDate,
							isRegisterable: schema.eventsTable.isRegisterable,
							organizationId: schema.eventsTable.organizationId,
						})
						.from(schema.eventsTable)
						.where(sql`${schema.eventsTable.isRecurringEventTemplate} = true`);
					const templateById = new Map(
						templates.map((template) => [template.id, template]),
					);

					const rules = organizations.flatMap((organization) =>
						sourceRules
							.map((rule) => {
								const baseRecurringEventId = deterministicUuid(
									`template:${organization.id}:${rule.baseRecurringEventId}`,
								);
								const template = templateById.get(baseRecurringEventId);
								if (!template) return null;

								const recurrenceStartDate =
									template.startAt != null
										? template.startAt
										: (parseDate(`${template.startDate}T00:00:00.000Z`) ?? now);

								const ruleId = deterministicUuid(
									`rule:${organization.id}:${rule.id}`,
								);

								const seededWindowEndDate = calculateMutationStyleWindowEndDate(
									recurrenceStartDate,
									rule.recurrenceEndDate
										? (parseDate(rule.recurrenceEndDate) ?? null)
										: null,
									12,
								);
								const seededInstanceStarts =
									rule.frequency === "WEEKLY"
										? generateWeeklyInstanceStarts(
												recurrenceStartDate,
												rule.byDay ?? null,
												template.allDay,
												seededWindowEndDate,
												rule.interval ?? 1,
												rule.count ?? null,
											)
										: throwUnsupportedSeedRecurrenceFrequency(rule.frequency);
								const latestInstanceDate =
									seededInstanceStarts.at(-1) ?? recurrenceStartDate;

								return {
									id: ruleId,
									recurrenceRuleString: rule.recurrenceRuleString,
									frequency: rule.frequency,
									interval: rule.interval,
									recurrenceStartDate,
									recurrenceEndDate: rule.recurrenceEndDate
										? (parseDate(rule.recurrenceEndDate) ?? null)
										: null,
									count: rule.count,
									latestInstanceDate,
									byDay: rule.byDay,
									byMonth: rule.byMonth,
									byMonthDay: rule.byMonthDay,
									baseRecurringEventId,
									originalSeriesId: deterministicUuid(
										`series:${organization.id}:${rule.originalSeriesId ?? rule.id}`,
									),
									organizationId: organization.id,
									creatorId: rule.creatorId,
									updaterId: null,
									createdAt: parseDate(rule.createdAt) ?? now,
									updatedAt: null,
								};
							})
							.filter((rule): rule is NonNullable<typeof rule> => rule != null),
					) as (typeof schema.recurrenceRulesTable.$inferInsert)[];

					await checkAndInsertData(
						schema.recurrenceRulesTable,
						rules,
						schema.recurrenceRulesTable.id,
						1000,
					);

					const instances: (typeof schema.recurringEventInstancesTable.$inferInsert)[] =
						[];
					for (const rule of rules) {
						if (!rule.id) continue;

						const template = templateById.get(rule.baseRecurringEventId);
						if (!template) continue;

						const recurrenceRuleId = rule.id;
						const originalSeriesId = rule.originalSeriesId ?? recurrenceRuleId;

						const windowEndDate = calculateMutationStyleWindowEndDate(
							rule.recurrenceStartDate,
							rule.recurrenceEndDate ?? null,
							12,
						);

						const generatedStarts =
							rule.frequency === "WEEKLY"
								? generateWeeklyInstanceStarts(
										rule.recurrenceStartDate,
										rule.byDay ?? null,
										template.allDay,
										windowEndDate,
										rule.interval ?? 1,
										rule.count ?? null,
									)
								: throwUnsupportedSeedRecurrenceFrequency(rule.frequency);

						const timedDurationMs =
							template.startAt != null && template.endAt != null
								? template.endAt.getTime() - template.startAt.getTime()
								: 60 * 60 * 1000;
						const durationMs =
							timedDurationMs > 0 ? timedDurationMs : 60 * 60 * 1000;

						const allDayDurationDays =
							template.startDate != null && template.endDate != null
								? Math.max(
										1,
										Math.ceil(
											(new Date(`${template.endDate}T00:00:00.000Z`).getTime() -
												new Date(
													`${template.startDate}T00:00:00.000Z`,
												).getTime()) /
												(24 * 60 * 60 * 1000),
										),
									)
								: 1;

						for (const [sequenceIndex, start] of generatedStarts.entries()) {
							const timedEnd = new Date(start.getTime() + durationMs);
							const actualStartDate = toDateOnlyString(start);
							const actualEndDate = toDateOnlyString(
								new Date(
									start.getTime() + allDayDurationDays * 24 * 60 * 60 * 1000,
								),
							);

							instances.push({
								id: deterministicUuid(
									`instance:${recurrenceRuleId}:${start.toISOString()}`,
								),
								baseRecurringEventId: rule.baseRecurringEventId,
								recurrenceRuleId,
								originalSeriesId,
								originalInstanceStartTime: template.allDay ? null : start,
								originalInstanceStartDate: template.allDay
									? actualStartDate
									: null,
								actualStartTime: template.allDay ? null : start,
								actualEndTime: template.allDay ? null : timedEnd,
								actualStartDate: template.allDay ? actualStartDate : null,
								actualEndDate: template.allDay ? actualEndDate : null,
								isCancelled: false,
								organizationId: rule.organizationId,
								generatedAt: now,
								lastUpdatedAt: null,
								version: "1",
								sequenceNumber: sequenceIndex + 1,
								totalCount: rule.count,
							});
						}
					}

					await checkAndInsertData(
						schema.recurringEventInstancesTable,
						instances,
						schema.recurringEventInstancesTable.id,
						1000,
					);

					const regularUsers = await db
						.select({ id: schema.usersTable.id })
						.from(schema.usersTable)
						.where(sql`${schema.usersTable.role} = 'regular'`);

					const scheduleByUser = new Map<
						string,
						Array<{ start: Date; end: Date }>
					>();
					for (const user of regularUsers) {
						scheduleByUser.set(user.id, []);
					}

					const attendees: (typeof schema.eventAttendeesTable.$inferInsert)[] =
						[];
					const registerableTemplateIds = new Set(
						templates
							.filter((template) => template.isRegisterable)
							.map((template) => template.id),
					);

					for (const instance of instances) {
						if (!registerableTemplateIds.has(instance.baseRecurringEventId))
							continue;

						const intervalStart =
							instance.actualStartTime ??
							new Date(`${instance.actualStartDate}T00:00:00.000Z`);
						const intervalEnd =
							instance.actualEndTime ??
							new Date(`${instance.actualEndDate}T00:00:00.000Z`);

						let assigned = 0;
						for (const user of regularUsers) {
							if (assigned >= 4) break;

							const schedule = scheduleByUser.get(user.id) ?? [];
							const hasConflict = schedule.some(
								(slot) => intervalStart < slot.end && intervalEnd > slot.start,
							);
							if (hasConflict) continue;

							schedule.push({ start: intervalStart, end: intervalEnd });
							scheduleByUser.set(user.id, schedule);

							attendees.push({
								id: deterministicUuid(`attendee:${instance.id}:${user.id}`),
								userId: user.id,
								eventId: null,
								recurringEventInstanceId: instance.id,
								isRegistered: true,
								isInvited: false,
								isCheckedIn: false,
								isCheckedOut: false,
								feedbackSubmitted: false,
								createdAt: now,
								updatedAt: null,
							});

							assigned += 1;
						}
					}

					await checkAndInsertData(
						schema.eventAttendeesTable,
						attendees,
						schema.eventAttendeesTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Recurrence rules, recurring instances, and pre-registrations (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "event_volunteers": {
					const eventVolunteers = JSON.parse(fileContent).map(
						(volunteer: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
						}) => ({
							...volunteer,
							createdAt: parseDate(volunteer.createdAt),
							updatedAt: parseDate(volunteer.updatedAt),
						}),
					) as (typeof schema.eventVolunteersTable.$inferInsert)[];

					await checkAndInsertData(
						schema.eventVolunteersTable,
						eventVolunteers,
						schema.eventVolunteersTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Event Volunteers table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "event_volunteer_memberships": {
					const eventVolunteerMemberships = JSON.parse(fileContent).map(
						(membership: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
						}) => ({
							...membership,
							createdAt: parseDate(membership.createdAt),
							updatedAt: parseDate(membership.updatedAt),
						}),
					) as (typeof schema.eventVolunteerMembershipsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.eventVolunteerMembershipsTable,
						eventVolunteerMemberships,
						schema.eventVolunteerMembershipsTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Event Volunteer Memberships table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "action_categories": {
					const actionCategories = JSON.parse(fileContent).map(
						(category: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
						}) => ({
							...category,
							createdAt: category.createdAt
								? new Date(category.createdAt)
								: new Date(),
							updatedAt: category.updatedAt
								? new Date(category.updatedAt)
								: new Date(),
						}),
					) as (typeof schema.actionItemCategoriesTable.$inferInsert)[];

					await checkAndInsertData(
						schema.actionItemCategoriesTable,
						actionCategories,
						schema.actionItemCategoriesTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Action Categories table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				case "action_items": {
					const action_items = JSON.parse(fileContent).map(
						(action_item: {
							id: string;
							isCompleted: boolean;
							assignedAt: string | number | Date;
							completionAt: string | number | Date;
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
							preCompletionNotes: string;
							postCompletionNotes: string;
							organizationId: string;
							categoryId: string;
							eventId: string | null;
							assigneeId: string;
							creatorId: string;
							updaterId: string;
						}) => ({
							...action_item,
							id: action_item.id.length === 36 ? action_item.id : uuidv7(),
							assignedAt: parseDate(action_item.assignedAt),
							completionAt: parseDate(action_item.completionAt),
							createdAt: parseDate(action_item.createdAt),
							updatedAt: action_item.updatedAt
								? parseDate(action_item.updatedAt)
								: null,
							categoryId:
								action_item.categoryId && action_item.categoryId.length === 36
									? action_item.categoryId
									: null,
							eventId:
								action_item.eventId && action_item.eventId.length === 36
									? action_item.eventId
									: null,
						}),
					) as (typeof schema.actionItemsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.actionItemsTable,
						action_items,
						schema.actionItemsTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Action Items table data (skipping duplicates)\x1b[0m",
					);
					break;
				}
				case "notification_templates": {
					const fileContent = await fs.readFile(
						`${process.cwd()}/scripts/dbManagement/sample_data/notification_templates.json`,
						"utf-8",
					);
					const notificationTemplatesRaw = JSON.parse(fileContent);
					type NotificationTemplate = {
						name: string;
						eventType: string;
						title: string;
						body: string;
						channelType: string;
						linkedRouteName: string;
					};

					const now = new Date();
					const notificationTemplates = notificationTemplatesRaw.map(
						(tpl: NotificationTemplate) => ({
							id: uuidv7(),
							name: tpl.name,
							eventType: tpl.eventType,
							title: tpl.title,
							body: tpl.body,
							channelType: tpl.channelType,
							linkedRouteName: tpl.linkedRouteName,
							createdAt: now,
							creatorId: "0194e194-c6b3-7802-b074-362efea24dbc",
							updatedAt: now,
							updaterId: "0194e194-c6b3-7802-b074-362efea24dbc",
						}),
					);
					await db
						.insert(schema.notificationTemplatesTable)
						.values(notificationTemplates);

					console.log(
						"\x1b[35mAdded: Notification_templates table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				default:
					console.log(`\x1b[31mInvalid table name: $collection\x1b[0m`);
					break;
			}
		}

		await checkDataSize("After");
	} catch (err) {
		throw new Error(`\x1b[31mError adding data to tables: ${err}\x1b[0m`);
	}

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

/**
 * Returns the next occurrence of the same weekday and time (hours, minutes) as
 * templateDate, on or after referenceDate. Used for recurring event template start/end.
 */
export function getNextOccurrenceOfWeekdayTime(
	referenceDate: Date,
	templateDate: Date,
): Date {
	const weekday = templateDate.getUTCDay();
	const hours = templateDate.getUTCHours();
	const minutes = templateDate.getUTCMinutes();
	const seconds = templateDate.getUTCSeconds();
	const ms = templateDate.getUTCMilliseconds();

	// Start from reference date at midnight UTC, then find next matching weekday
	const ref = new Date(
		Date.UTC(
			referenceDate.getUTCFullYear(),
			referenceDate.getUTCMonth(),
			referenceDate.getUTCDate(),
			0,
			0,
			0,
			0,
		),
	);
	ref.setUTCHours(hours, minutes, seconds, ms);
	const refDay = ref.getUTCDay();
	let daysToAdd = (weekday - refDay + 7) % 7;
	if (daysToAdd === 0 && referenceDate.getTime() > ref.getTime()) {
		daysToAdd = 7;
	}
	ref.setUTCDate(ref.getUTCDate() + daysToAdd);
	return ref;
}

type SourceRecurringTemplate = {
	id: string;
	createdAt: string | number | Date;
	creatorId: string;
	description: string | null;
	endAt: string | null;
	name: string;
	organizationId: string;
	startAt: string | null;
	allDay: boolean;
	isPublic: boolean;
	isRegisterable: boolean;
	location: string | null;
	updatedAt: string | null;
	updaterId: string | null;
	isRecurringEventTemplate: boolean;
	isInviteOnly: boolean;
	startDate: string | null;
	endDate: string | null;
};

type SourceRecurrenceRule = {
	id: string;
	recurrenceRuleString: string;
	frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
	interval: number;
	recurrenceStartDate: string;
	recurrenceEndDate: string | null;
	count: number | null;
	latestInstanceDate: string;
	byDay: string[] | null;
	byMonth: number[] | null;
	byMonthDay: number[] | null;
	baseRecurringEventId: string;
	originalSeriesId: string | null;
	organizationId: string;
	creatorId: string;
	updaterId: string | null;
	createdAt: string;
	updatedAt: string;
};

function parseRecurringTemplates(
	fileContent: string,
): SourceRecurringTemplate[] {
	const parsed = JSON.parse(fileContent) as
		| { events?: Record<string, unknown>[] }
		| Record<string, unknown>[];
	const rows = Array.isArray(parsed) ? parsed : (parsed.events ?? []);

	return rows.map((row) => ({
		id: String(row.id),
		createdAt: (row.createdAt ?? row.created_at ?? new Date().toISOString()) as
			| string
			| number
			| Date,
		creatorId: String(row.creatorId ?? row.creator_id),
		description: (row.description ?? null) as string | null,
		endAt: (row.endAt ?? row.end_at ?? null) as string | null,
		name: String(row.name),
		organizationId: String(row.organizationId ?? row.organization_id),
		startAt: (row.startAt ?? row.start_at ?? null) as string | null,
		allDay: Boolean(row.allDay ?? row.all_day),
		isPublic: Boolean(row.isPublic ?? row.is_public),
		isRegisterable: Boolean(row.isRegisterable ?? row.is_registerable),
		location: (row.location ?? null) as string | null,
		updatedAt: (row.updatedAt ?? row.updated_at ?? null) as string | null,
		updaterId: (row.updaterId ?? row.updater_id ?? null) as string | null,
		isRecurringEventTemplate: Boolean(
			row.isRecurringEventTemplate ?? row.is_recurring_template ?? true,
		),
		isInviteOnly: Boolean(row.isInviteOnly ?? row.is_invite_only),
		startDate: (row.startDate ?? row.start_date ?? null) as string | null,
		endDate: (row.endDate ?? row.end_date ?? null) as string | null,
	}));
}

function parseRecurrenceRules(fileContent: string): SourceRecurrenceRule[] {
	const parsed = JSON.parse(fileContent) as
		| { recurrence_rules?: Record<string, unknown>[] }
		| Record<string, unknown>[];
	const rows = Array.isArray(parsed) ? parsed : (parsed.recurrence_rules ?? []);

	return rows.map((row) => ({
		id: String(row.id),
		recurrenceRuleString: String(
			row.recurrenceRuleString ?? row.recurrence_rule_string,
		),
		frequency: String(row.frequency) as SourceRecurrenceRule["frequency"],
		interval: Number(row.interval ?? 1),
		recurrenceStartDate: String(
			row.recurrenceStartDate ?? row.recurrence_start_date,
		),
		recurrenceEndDate: (row.recurrenceEndDate ??
			row.recurrence_end_date ??
			null) as string | null,
		count: (row.count ?? null) as number | null,
		latestInstanceDate: String(
			row.latestInstanceDate ?? row.latest_instance_date,
		),
		byDay: normalizeByDay(row.byDay ?? row.by_day),
		byMonth: (row.byMonth ?? row.by_month ?? null) as number[] | null,
		byMonthDay: (row.byMonthDay ?? row.by_month_day ?? null) as number[] | null,
		baseRecurringEventId: String(
			row.baseRecurringEventId ?? row.base_recurring_event_id,
		),
		originalSeriesId: (row.originalSeriesId ??
			row.original_series_id ??
			null) as string | null,
		organizationId: String(row.organizationId ?? row.organization_id),
		creatorId: String(row.creatorId ?? row.creator_id),
		updaterId: (row.updaterId ?? row.updater_id ?? null) as string | null,
		createdAt: String(row.createdAt ?? row.created_at),
		updatedAt: String(row.updatedAt ?? row.updated_at),
	}));
}

function normalizeByDay(value: unknown): string[] | null {
	if (value == null) return null;
	if (Array.isArray(value)) {
		const days = value.map((entry) => String(entry).trim()).filter(Boolean);
		return days.length > 0 ? days : null;
	}

	const input = String(value).trim();
	if (input === "") return null;
	if (input.startsWith("{") && input.endsWith("}")) {
		const days = input
			.slice(1, -1)
			.split(",")
			.map((entry) => entry.trim())
			.filter(Boolean);
		return days.length > 0 ? days : null;
	}

	return [input];
}

function buildTemplateTimingFromSource(
	template: SourceRecurringTemplate,
	referenceDate: Date,
): {
	allDay: boolean;
	startAt: Date | null;
	endAt: Date | null;
	startDate: string | null;
	endDate: string | null;
} {
	if (template.allDay) {
		const sourceStartDate = template.startDate
			? parseDate(`${template.startDate}T00:00:00.000Z`)
			: null;
		const sourceEndDate = template.endDate
			? parseDate(`${template.endDate}T00:00:00.000Z`)
			: null;

		const startRef = sourceStartDate ?? referenceDate;
		const start = getNextOccurrenceOfWeekdayTime(referenceDate, startRef);
		const durationDays =
			sourceStartDate != null && sourceEndDate != null
				? Math.max(
						1,
						Math.ceil(
							(sourceEndDate.getTime() - sourceStartDate.getTime()) /
								(24 * 60 * 60 * 1000),
						),
					)
				: 1;
		const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

		return {
			allDay: true,
			startAt: null,
			endAt: null,
			startDate: toDateOnlyString(start),
			endDate: toDateOnlyString(end),
		};
	}

	const sourceStartAt = template.startAt
		? parseDate(template.startAt)
		: parseDate(referenceDate);
	const sourceEndAt = template.endAt ? parseDate(template.endAt) : null;

	const start = getNextOccurrenceOfWeekdayTime(
		referenceDate,
		sourceStartAt ?? referenceDate,
	);
	const durationMs =
		sourceStartAt != null && sourceEndAt != null
			? sourceEndAt.getTime() - sourceStartAt.getTime()
			: 60 * 60 * 1000;
	const boundedDurationMs = durationMs > 0 ? durationMs : 60 * 60 * 1000;
	const end = new Date(start.getTime() + boundedDurationMs);

	return {
		allDay: false,
		startAt: start,
		endAt: end,
		startDate: null,
		endDate: null,
	};
}

export function generateWeeklyInstanceStarts(
	recurrenceStartDate: Date,
	byDay: string[] | null,
	isAllDay: boolean,
	windowEndDate: Date,
	intervalWeeks: number,
	countLimit: number | null,
): Date[] {
	const days = byDay?.length
		? byDay
		: [WEEKDAY_CODES[recurrenceStartDate.getUTCDay()] ?? "MO"];
	const normalizedIntervalWeeks = Math.max(1, intervalWeeks);
	const [hours, minutes, seconds, milliseconds] = isAllDay
		? [0, 0, 0, 0]
		: [
				recurrenceStartDate.getUTCHours(),
				recurrenceStartDate.getUTCMinutes(),
				recurrenceStartDate.getUTCSeconds(),
				recurrenceStartDate.getUTCMilliseconds(),
			];

	const starts = new Set<number>();
	for (const day of days) {
		const weekday = WEEKDAY_TO_INDEX[day] ?? recurrenceStartDate.getUTCDay();
		const first = getNextOccurrenceForWeekdayTime(
			recurrenceStartDate,
			weekday,
			hours,
			minutes,
			seconds,
			milliseconds,
		);

		for (
			let occurrence = new Date(first.getTime());
			occurrence.getTime() <= windowEndDate.getTime();
			occurrence = new Date(
				occurrence.getTime() +
					normalizedIntervalWeeks * 7 * 24 * 60 * 60 * 1000,
			)
		) {
			starts.add(occurrence.getTime());
		}
	}

	const sortedStarts = Array.from(starts)
		.sort((left, right) => left - right)
		.map((timestamp) => new Date(timestamp));

	if (countLimit != null && countLimit > 0) {
		return sortedStarts.slice(0, countLimit);
	}

	return sortedStarts;
}

export function calculateMutationStyleWindowEndDate(
	recurrenceStartDate: Date,
	recurrenceEndDate: Date | null,
	hotWindowMonthsAhead: number,
): Date {
	const defaultWindowEnd = new Date(recurrenceStartDate.getTime());
	defaultWindowEnd.setUTCMonth(
		defaultWindowEnd.getUTCMonth() + hotWindowMonthsAhead,
	);

	if (recurrenceEndDate != null && recurrenceEndDate < defaultWindowEnd) {
		return recurrenceEndDate;
	}

	return defaultWindowEnd;
}

const WEEKDAY_TO_INDEX: Record<string, number> = {
	SU: 0,
	MO: 1,
	TU: 2,
	WE: 3,
	TH: 4,
	FR: 5,
	SA: 6,
};

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function throwUnsupportedSeedRecurrenceFrequency(frequency: string): never {
	throw new Error(
		`NotImplemented: Unsupported recurrence frequency in seed data: ${frequency}`,
	);
}

function getNextOccurrenceForWeekdayTime(
	referenceDate: Date,
	weekday: number,
	hours: number,
	minutes: number,
	seconds: number,
	milliseconds: number,
): Date {
	const reference = new Date(
		Date.UTC(
			referenceDate.getUTCFullYear(),
			referenceDate.getUTCMonth(),
			referenceDate.getUTCDate(),
			hours,
			minutes,
			seconds,
			milliseconds,
		),
	);

	const dayDelta = (weekday - reference.getUTCDay() + 7) % 7;
	reference.setUTCDate(reference.getUTCDate() + dayDelta);
	if (reference.getTime() < referenceDate.getTime()) {
		reference.setUTCDate(reference.getUTCDate() + 7);
	}

	return reference;
}

function deterministicUuid(seed: string): string {
	const hash = createHash("sha256").update(seed).digest("hex");
	const hex = hash.slice(0, 32).split("");
	hex[12] = "5";
	hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
	const compact = hex.join("");

	return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`;
}

function toDateOnlyString(date: Date): string {
	return [
		date.getUTCFullYear(),
		String(date.getUTCMonth() + 1).padStart(2, "0"),
		String(date.getUTCDate()).padStart(2, "0"),
	].join("-");
}

/**
 * Checks record counts in specified tables after data insertion.
 * @returns {Promise<boolean>} - Returns true if data exists, false otherwise.
 */
export async function checkDataSize(stage: string): Promise<boolean> {
	try {
		const tables = [
			{ name: "users", table: schema.usersTable },
			{ name: "organizations", table: schema.organizationsTable },
			{
				name: "organization_memberships",
				table: schema.organizationMembershipsTable,
			},
			{ name: "posts", table: schema.postsTable },
			{ name: "tag_folders", table: schema.tagFoldersTable },
			{ name: "tags", table: schema.tagsTable },
			{ name: "tag_assignments", table: schema.tagAssignmentsTable },
			{ name: "post_votes", table: schema.postVotesTable },
			{ name: "post_attachments", table: schema.postAttachmentsTable },
			{ name: "comments", table: schema.commentsTable },
			{ name: "membership_requests", table: schema.membershipRequestsTable },
			{ name: "comment_votes", table: schema.commentVotesTable },
			{ name: "action_items", table: schema.actionItemsTable },
			{ name: "events", table: schema.eventsTable },
			{ name: "recurrence_rules", table: schema.recurrenceRulesTable },
			{
				name: "recurring_event_instances",
				table: schema.recurringEventInstancesTable,
			},
			{ name: "event_attendees", table: schema.eventAttendeesTable },
			{ name: "event_volunteers", table: schema.eventVolunteersTable },
			{
				name: "event_volunteer_memberships",
				table: schema.eventVolunteerMembershipsTable,
			},
			{
				name: "actionitem_categories",
				table: schema.actionItemCategoriesTable,
			},
		];

		console.log(`\nRecord Counts ${stage} Import:\n`);

		console.log(
			`${"| Table Name".padEnd(30)}| Record Count |
${"|".padEnd(30, "-")}|----------------|
`,
		);

		let dataExists = false;

		for (const { name, table } of tables) {
			const result = await db
				.select({ count: sql<number>`count(*)` })
				.from(table);

			const count = result?.[0]?.count ?? 0;
			console.log(`| ${name.padEnd(28)}| ${count.toString().padEnd(15)}|`);

			if (count > 0) {
				dataExists = true;
			}
		}

		return dataExists;
	} catch (err) {
		console.error(`\x1b[31mError checking record count: ${err}\x1b[0m`);
		return false;
	}
}

export async function disconnect(): Promise<boolean> {
	try {
		await queryClient.end();
	} catch (err) {
		throw new Error(
			`\x1b[31mError disconnecting from the database: ${err}\x1b[0m`,
		);
	}
	return true;
}
