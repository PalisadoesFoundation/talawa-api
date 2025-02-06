import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuidv4 } from "uuid";
import * as schema from "../drizzle/schema";
dotenv.config();

const dirname: string = path.dirname(fileURLToPath(import.meta.url));

const queryClient = postgres({
	host: process.env.API_POSTGRES_HOST,
	port: Number(process.env.API_POSTGRES_PORT),
	database: process.env.API_POSTGRES_DATABASE,
	username: process.env.API_POSTGRES_USER,
	password: process.env.API_POSTGRES_PASSWORD,
	ssl: process.env.API_POSTGRES_SSL_MODE === "true",
});

const db = drizzle(queryClient, { schema });

interface LoadOptions {
	items?: string[];
	format?: boolean;
}

/**
 * Lists sample data files and their document counts in the sample_data directory.
 */
export async function listSampleData(): Promise<void> {
	try {
		const sampleDataPath = path.resolve(dirname, "../../scripts");
		const files = await fs.readdir(sampleDataPath);

		console.log("Sample Data Files:\n");

		for (const file of files) {
			if (file.endsWith(".json")) {
				const filePath = path.join(sampleDataPath, file);
				const data = await fs.readFile(filePath, "utf8");
				const documents = JSON.parse(data);
				console.log(`${file}: ${documents.length} documents`);
			}
		}
	} catch (error) {
		console.error("Error listing sample data:", error);
	}
}

/**
 * Clears all tables in the database.
 */
async function formatDatabase(): Promise<void> {
	const tables = [
		schema.usersTable,
		schema.postsTable,
		schema.organizationsTable,
		schema.eventsTable,
	];

	for (const table of tables) {
		await db.delete(table);
	}
	console.log("Cleared all tables\n");
}

/**
 * Inserts data into specified tables.
 * @param collections - Array of collection/table names to insert data into
 * @param options - Options for loading data
 */
async function insertCollections(
	collections: string[],
	options: LoadOptions = {},
): Promise<void> {
	try {
		if (options.format) {
			await formatDatabase();
		}

		const userIds: string[] = [];
		const organizationIds: string[] = [];

		for (const collection of collections) {
			const filePath = path.resolve(
				dirname,
				`../../scripts/${collection}.json`,
			);
			const data = await fs.readFile(filePath, "utf8");
			const documents = JSON.parse(data);

			switch (collection) {
				case "users": {
					const users = documents.map(
						(user: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
						}) => {
							const id = uuidv4();
							userIds.push(id);
							return {
								...user,
								id,
								emailAddress: `${uuidv4()}@example.com`, // Ensure unique email address
								createdAt: user.createdAt
									? new Date(user.createdAt)
									: new Date(),
								updatedAt: user.updatedAt
									? new Date(user.updatedAt)
									: new Date(),
							};
						},
					) as (typeof schema.usersTable.$inferInsert)[];
					await db.insert(schema.usersTable).values(users);
					break;
				}
				case "organizations": {
					type OrgType = {
						name: string;
						createdAt: string | number | Date;
						updatedAt: string | number | Date;
					};
					const organizations = documents.map((org: OrgType) => {
						const id = uuidv4();
						organizationIds.push(id);
						return {
							...org,
							id, // Convert to valid UUID
							name: `${org.name}-${uuidv4()}`, // Ensure unique organization name
							createdAt: org.createdAt ? new Date(org.createdAt) : new Date(),
							updatedAt: org.updatedAt ? new Date(org.updatedAt) : new Date(),
							creatorId: userIds[Math.floor(Math.random() * userIds.length)], // Use valid user ID
							updaterId: userIds[Math.floor(Math.random() * userIds.length)], // Use valid user ID
						};
					}) as (typeof schema.organizationsTable.$inferInsert)[];
					await db.insert(schema.organizationsTable).values(organizations);
					break;
				}
				case "posts": {
					const posts = documents.map(
						(post: {
							createdAt: string | number | Date;
							updatedAt: string | number | Date;
							pinnedAt: string | number | Date;
						}) => ({
							...post,
							id: uuidv4(), // Convert to valid UUID
							createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
							updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date(),
							pinnedAt: post.pinnedAt ? new Date(post.pinnedAt) : null,
							creatorId: userIds[Math.floor(Math.random() * userIds.length)], // Use valid user ID
							updaterId: userIds[Math.floor(Math.random() * userIds.length)], // Use valid user ID
							organizationId:
								organizationIds[
									Math.floor(Math.random() * organizationIds.length)
								], // Use valid organization ID
						}),
					) as (typeof schema.postsTable.$inferInsert)[];
					await db.insert(schema.postsTable).values(posts);
					break;
				}
				case "events": {
					type EventType = {
						name: string;
						description: string;
						createdAt: string | number | Date;
						updatedAt: string | number | Date;
						startAt: string | number | Date;
						endAt: string | number | Date;
					};
					const events = documents.map((event: EventType) => ({
						...event,
						id: uuidv4(), // Convert to valid UUID
						name: event.name,
						description: event.description,
						createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
						updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
						startAt: event.startAt ? new Date(event.startAt) : new Date(),
						endAt: event.endAt ? new Date(event.endAt) : new Date(),
						creatorId: userIds[Math.floor(Math.random() * userIds.length)], // Use valid user ID
						updaterId: userIds[Math.floor(Math.random() * userIds.length)], // Use valid user ID
						organizationId:
							organizationIds[
								Math.floor(Math.random() * organizationIds.length)
							], // Use valid organization ID
					})) as (typeof schema.eventsTable.$inferInsert)[];
					await db.insert(schema.eventsTable).values(events);
					break;
				}
				default:
					console.log("\x1b[31m", `Invalid table name: ${collection}`);
					break;
			}

			console.log("\x1b[35m", `Added ${collection} table data`);
		}

		await checkCountAfterImport();
		await queryClient.end();

		console.log("\nTables populated successfully");
	} catch (error) {
		console.error("Failed to import sample data:", error);
		process.exit(1);
	} finally {
		await queryClient.end().catch(console.error);
	}
	process.exit(0);
}

/**
 * Checks record counts in specified tables after data insertion.
 */
async function checkCountAfterImport(): Promise<void> {
	try {
		const tables = [
			{ name: "users", table: schema.usersTable },
			{ name: "organizations", table: schema.organizationsTable },
			{ name: "posts", table: schema.postsTable },
			{ name: "events", table: schema.eventsTable },
		];

		console.log("\nRecord Counts After Import:\n");

		console.log(
			`${"| Table Name".padEnd(30)}| Record Count |
			${"|".padEnd(30, "-")}|----------------|
			`,
		);

		for (const { name, table } of tables) {
			const result = await db
				.select({ count: sql<number>`count(*)` })
				.from(table);

			const count = result?.[0]?.count ?? 0;
			console.log(`| ${name.padEnd(28)}| ${count.toString().padEnd(15)}|`);
		}
	} catch (err) {
		console.error("\x1b[31m", `Error checking record count: ${err}`);
	}
}

const collections = ["users", "organizations", "posts", "events"];

const args = process.argv.slice(2);
const options: LoadOptions = {
	format: args.includes("--format") || args.includes("-f"),
	items: undefined,
};

const itemsIndex = args.findIndex((arg) => arg === "--items" || arg === "-i");
if (itemsIndex !== -1 && args[itemsIndex + 1]) {
	const items = args[itemsIndex + 1];
	options.items = items ? items.split(",") : undefined;
}

(async (): Promise<void> => {
	await listSampleData();
	await insertCollections(options.items || collections, options);
})();
