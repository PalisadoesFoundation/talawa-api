import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { hash } from "@node-rs/argon2";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "src/drizzle/schema";
import { uuidv7 } from "uuidv7";

dotenv.config();

// Get the directory name of the current module
export const dirname: string = path.dirname(fileURLToPath(import.meta.url));

// Create a new database client
export const queryClient = postgres({
	host:
		process.env.NODE_ENV === "test"
			? process.env.API_POSTGRES_TEST_HOST || ""
			: process.env.API_POSTGRES_HOST || "",
	port: Number(process.env.API_POSTGRES_PORT) || 1,
	database: process.env.API_POSTGRES_DATABASE || "",
	username: process.env.API_POSTGRES_USER || "",
	password: process.env.API_POSTGRES_PASSWORD || "",
	ssl: process.env.API_POSTGRES_SSL_MODE === "true",
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
	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"\n\x1b[31mRestricted: Resetting the database in production is not allowed\x1b[0m\n",
		);
	}
	type TableRow = { tablename: string };
	const tables: TableRow[] = await db.execute(sql`
		SELECT tablename FROM pg_catalog.pg_tables 
		WHERE schemaname = 'public'
	`);

	const tableNames = tables.map((row) => sql.identifier(row.tablename));

	if (tableNames.length > 0) {
		await db.execute(
			sql`TRUNCATE TABLE ${sql.join(tableNames, sql`, `)} RESTART IDENTITY CASCADE;`,
		);
	}

	return true;
}

export async function ensureAdministratorExists(): Promise<boolean> {
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
		return true;
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

	return true;
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
			process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
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
		console.error(`\x1b[31mError checking record count: ${err}\x1b[0m`);
		return false;
	}
}

export async function disconnect(): Promise<boolean> {
	try {
		await queryClient.end();
	} catch (err) {
		console.error(`Error disconnecting from database: ${err}`);
		return false;
	}
	return true;
}
