import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === "test";

// Setup PostgreSQL connection
const queryClient = postgres({
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

const expectedCounts: Record<string, number> = {
	users: 16,
	organizations: 4,
	organization_memberships: 18,
};

/**
 * Checks record counts in specified tables after data insertion.
 * @returns {Promise<boolean>} - Returns true if data matches expected values.
 */
async function checkCountAfterImport(): Promise<boolean> {
	try {
		const tables = [
			{ name: "users", table: schema.usersTable },
			{ name: "organizations", table: schema.organizationsTable },
			{
				name: "organization_memberships",
				table: schema.organizationMembershipsTable,
			},
		];
		let allValid = true;
		for (const { name, table } of tables) {
			const result = await db
				.select({ count: sql<number>`count(*)` })
				.from(table);
			const actualCount = Number(result[0]?.count ?? 0); // Convert actual count to number
			const expectedCount = expectedCounts[name]; // Expected count is already a number

			if (actualCount !== expectedCount) {
				console.error(
					`ERROR: Record count mismatch in ${name} (Expected ${expectedCount}, Found ${actualCount})`,
				);
				allValid = false;
			}
		}

		return allValid;
	} catch (error) {
		console.error(`ERROR: ${error}`);
		return false;
	}
}

/**
 * Makes an update in the database (Modify the first user's name).
 * @returns {Promise<boolean>} - Returns true if the update was successful.
 */
async function updateDatabase(): Promise<boolean> {
	const updatedName = "Test User";

	try {
		const user = await db.select().from(schema.usersTable).limit(1);
		if (user.length === 0) {
			console.error("ERROR: No user found to update!");
			return false;
		}

		const userId = user[0]?.id;

		await db
			.update(schema.usersTable)
			.set({ name: updatedName })
			.where(sql`id = ${userId}`);

		const updatedUser = await db
			.select()
			.from(schema.usersTable)
			.where(sql`id = ${userId}`);

		if (updatedUser[0]?.name !== updatedName) {
			console.error("ERROR: Database update failed!");
			return false;
		}
		return true;
	} catch (error) {
		console.error(`ERROR: ${error}`);
		return false;
	}
}

/**
 * Runs the validation and update process.
 */
async function runValidation(): Promise<void> {
	try {
		const validRecords = await checkCountAfterImport();
		if (!validRecords) {
			console.error("\nERROR: Database validation failed!");
			process.exit(1);
		}
		console.log("\nDatabase Validation : Success");
		const updateSuccess = await updateDatabase();
		if (!updateSuccess) {
			console.error("\nERROR: Database update validation failed!");
			process.exit(1);
		}
		console.log("Database Updation : Success");
		process.exit(0);
	} catch (error) {
		if (error instanceof Error) {
			console.error(`\nERROR: ${error.message}`);
		} else {
			console.error(`\nERROR: ${String(error)}`);
		}
		process.exit(1);
	}
}

runValidation();
