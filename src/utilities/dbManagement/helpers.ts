import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "@node-rs/argon2";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import * as schema from "../../drizzle/schema";

//Load Environment Variables
dotenv.config();
const NODE_ENV = process.env.NODE_ENV || "development";

const isTestEnvironment = process.env.NODE_ENV === "test";

// Get the directory name of the current module
const dirname: string = path.dirname(fileURLToPath(import.meta.url));

// Create a new database client
export const queryClient = postgres({
	host: isTestEnvironment
		? process.env.API_POSTGRES_TEST_HOST
		: process.env.API_POSTGRES_HOST,
	port: Number(process.env.API_POSTGRES_PORT),
	database: process.env.API_POSTGRES_DATABASE,
	username: process.env.API_POSTGRES_USER,
	password: process.env.API_POSTGRES_PASSWORD,
	ssl: process.env.API_POSTGRES_SSL_MODE === "true",
});

const db = drizzle(queryClient, { schema });

/**
 * Clears all tables in the database.
 */
export async function formatDatabase(): Promise<void> {
	if (NODE_ENV === "production") {
		throw new Error(
			"\n\x1b[31mRestricted: Resetting the database in production is not allowed\x1b[0m\n",
		);
	}

	const tables = await db.execute(sql`
		SELECT tablename FROM pg_catalog.pg_tables 
		WHERE schemaname = 'public'
	`);

	for (const row of tables) {
		const tableName = row.tablename;
		if (typeof tableName === "string") {
			await db.execute(sql`DELETE FROM ${sql.identifier(tableName)}`);
		}
	}
}

export async function ensureAdministratorExists(): Promise<void> {
	const email = process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;

	if (!email) {
		throw new Error("API_ADMINISTRATOR_USER_EMAIL_ADDRESS is not defined.");
	}

	const existingUser = await db.query.usersTable.findFirst({
		columns: { id: true, role: true },
		where: (fields, operators) => operators.eq(fields.emailAddress, email),
	});

	if (existingUser) {
		if (existingUser.role !== "administrator") {
			await db
				.update(schema.usersTable)
				.set({ role: "administrator" })
				.where(sql`email_address = ${email}`);
			console.log("Role Change: Updated user role to administrator");
		} else {
			console.log("\x1b[33mFound: Administrator user already exists\x1b[0m \n");
		}
		return;
	}

	const userId = uuidv7();
	const password = process.env.API_ADMINISTRATOR_USER_PASSWORD;
	if (!password) {
		throw new Error("API_ADMINISTRATOR_USER_PASSWORD is not defined.");
	}
	const passwordHash = await hash(password);

	await db.insert(schema.usersTable).values({
		id: userId,
		emailAddress: email,
		name: process.env.API_ADMINISTRATOR_USER_NAME || "",
		passwordHash,
		role: "administrator",
		isEmailAddressVerified: true,
		creatorId: userId,
	});
}

/**
 * Lists sample data files and their document counts in the sample_data directory.
 */
export async function listSampleData(): Promise<void> {
	try {
		const sampleDataPath = path.resolve(dirname, "./sample_data");
		const files = await fs.readdir(sampleDataPath);

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
		console.error("\x1b[31m", `Error listing sample data: ${err}`);
	}
}

/**
 * Check database connection
 */

export async function pingDB(): Promise<void> {
	try {
		await db.execute(sql`SELECT 1`);
	} catch (error) {
		throw new Error("Unable to connect to the database.");
	}
}

/**
 * Check duplicate data
 */

export async function checkAndInsertData<T>(
	table: PgTable,
	rows: T[],
	conflictTarget: AnyPgColumn | AnyPgColumn[],
	batchSize: number,
): Promise<void> {
	if (!rows.length) return;

	for (let i = 0; i < rows.length; i += batchSize) {
		const batch = rows.slice(i, i + batchSize);
		await db
			.insert(table)
			.values(batch)
			.onConflictDoNothing({
				target: Array.isArray(conflictTarget)
					? conflictTarget
					: [conflictTarget],
			});
	}
}

/**
 * Inserts data into specified tables.
 * @param collections - Array of collection/table names to insert data into
 * @param options - Options for loading data
 */

export async function insertCollections(collections: string[]): Promise<void> {
	try {
		await checkDataSize("Before");

		const API_ADMINISTRATOR_USER_EMAIL_ADDRESS =
			process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
		if (!API_ADMINISTRATOR_USER_EMAIL_ADDRESS) {
			console.error(
				"\x1b[31m",
				"API_ADMINISTRATOR_USER_EMAIL_ADDRESS is not defined in .env file",
			);
			return;
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
						console.error(
							"\x1b[31m",
							"API_ADMINISTRATOR_USER_EMAIL_ADDRESS is not found in users table",
						);
						return;
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

				default:
					console.log("\x1b[31m", `Invalid table name: ${collection}`);
					break;
			}
		}

		await checkDataSize("After");
	} catch (err) {
		throw new Error(`\x1b[31mError adding data to tables: ${err}\x1b[0m`);
	}
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
			{
				name: "organization_memberships",
				table: schema.organizationMembershipsTable,
			},
			{ name: "organizations", table: schema.organizationsTable },
			{ name: "users", table: schema.usersTable },
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
		console.error("\x1b[31m", `Error checking record count: ${err}`);
		return false;
	}
}

export async function disconnect(): Promise<void> {
	await queryClient.end();
}
