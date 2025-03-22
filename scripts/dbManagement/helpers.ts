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
import { v4 as uuidv4 } from "uuid";

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
	} catch (error) {
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
				stream.on(
					"data",
					(obj: {
						name: string;
					}) => {
						objects.push(obj.name);
					},
				);
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
 * Lists sample data files and their document counts in the sample_data directory.
 */
export async function listSampleData(): Promise<boolean> {
	try {
		const sampleDataPath = path.resolve(dirname, "./sample_data");
		const files = await fs.readdir(sampleDataPath);
		console.log(files);
		console.log("Sample Data Files:\n");

		console.log(
			`${"| File Name".padEnd(30)}| Document Count |
${"|".padEnd(30, "-")}|----------------|
`,
		);

		for (const file of files) {
			const filePath = path.resolve(sampleDataPath, file);
			const stats = await fs.stat(filePath);
			if (stats.isFile()) {
				const data = await fs.readFile(filePath, "utf8");
				const docs = JSON.parse(data);
				console.log(
					`| ${file.padEnd(28)}| ${docs.length.toString().padEnd(15)}|`,
				);
			}
		}
		console.log();
	} catch (err) {
		throw new Error(`\x1b[31mError listing sample data: ${err}\x1b[0m`);
	}

	return true;
}

/**
 * Check database connection
 */

export async function pingDB(): Promise<boolean> {
	try {
		await db.execute(sql`SELECT 1`);
	} catch (error) {
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
						}) => ({
							...user,
							createdAt: parseDate(user.createdAt),
							updatedAt: parseDate(user.updatedAt),
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
						(membership: {
							createdAt: string | number | Date;
						}) => ({
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
									attachment.name,
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
					const events = JSON.parse(fileContent).map(
						(event: {
							id: string;
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
							startAt: string | number | Date;
							endAt: string | number | Date;
						}) => ({
							...event,
							createdAt: parseDate(event.createdAt),
							updatedAt: parseDate(event.updatedAt),
							startAt: parseDate(event.startAt),
							endAt: parseDate(event.endAt),
						}),
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
					) as (typeof schema.actionCategoriesTable.$inferInsert)[];

					await checkAndInsertData(
						schema.actionCategoriesTable,
						actionCategories,
						schema.actionCategoriesTable.id,
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
							id: action_item.id.length === 36 ? action_item.id : uuidv4(),
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
					) as (typeof schema.actionsTable.$inferInsert)[];

					await checkAndInsertData(
						schema.actionsTable,
						action_items,
						schema.actionsTable.id,
						1000,
					);

					console.log(
						"\x1b[35mAdded: Action Items table data (skipping duplicates)\x1b[0m",
					);
					break;
				}

				default:
					console.log(`\x1b[31mInvalid table name: ${collection}\x1b[0m`);
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
			{ name: "post_votes", table: schema.postVotesTable },
			{ name: "post_attachments", table: schema.postAttachmentsTable },
			{ name: "comments", table: schema.commentsTable },
			{ name: "comment_votes", table: schema.commentVotesTable },
			{ name: "action_items", table: schema.actionsTable },
			{ name: "events", table: schema.eventsTable },
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
