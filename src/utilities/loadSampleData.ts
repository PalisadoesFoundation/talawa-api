import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import inquirer from "inquirer";

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
    const sampleDataPath = path.resolve(dirname, "../../sample_data");
    const files = await fs.readdir(sampleDataPath);

    console.log("Sample Data Files:\n");

    console.log(
      `${"| File Name".padEnd(30)}| Document Count |
${"|".padEnd(30, "-")}|----------------|
`
    );

    for (const file of files) {
      const filePath = path.resolve(sampleDataPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        const data = await fs.readFile(filePath, "utf8");
        const docs = JSON.parse(data);
        console.log(
          `| ${file.padEnd(28)}| ${docs.length.toString().padEnd(15)}|`
        );
      }
    }
    console.log();
  } catch (err) {
    console.error("\x1b[31m", `Error listing sample data: ${err}`);
  }
}

/**
 * Clears all tables in the database except for the specified user.
 */
async function formatDatabase(): Promise<void> {
  const emailToKeep = "administrator@email.com";

  const tables = [
    schema.postsTable,
    schema.organizationsTable,
    schema.eventsTable,
    schema.organizationMembershipsTable,
  ];

  for (const table of tables) {
    await db.delete(table);
  }

  // Delete all users except the specified one
  await db
    .delete(schema.usersTable)
    .where(sql`email_address != ${emailToKeep}`);

  console.log("Cleared all tables except the specified user\n");
}

/**
 * Inserts data into specified tables.
 * @param collections - Array of collection/table names to insert data into
 * @param options - Options for loading data
 */
async function insertCollections(
  collections: string[],
  options: LoadOptions = {}
): Promise<void> {
  try {
    if (options.format) {
      await formatDatabase();
    }

    for (const collection of collections) {
      const data = await fs.readFile(
        path.resolve(dirname, `../../sample_data/${collection}.json`),
        "utf8"
      );

      switch (collection) {
        case "users": {
          const users = JSON.parse(data).map(
            (user: {
              createdAt: string | number | Date;
              updatedAt: string | number | Date;
            }) => ({
              ...user,
              createdAt: parseDate(user.createdAt),
              updatedAt: parseDate(user.updatedAt),
            })
          ) as (typeof schema.usersTable.$inferInsert)[];
          await db.insert(schema.usersTable).values(users);
          break;
        }
        case "organizations": {
          const organizations = JSON.parse(data).map(
            (org: {
              createdAt: string | number | Date;
              updatedAt: string | number | Date;
            }) => ({
              ...org,
              createdAt: parseDate(org.createdAt),
              updatedAt: parseDate(org.updatedAt),
            })
          ) as (typeof schema.organizationsTable.$inferInsert)[];
          await db.insert(schema.organizationsTable).values(organizations);
          break;
        }
        case "organization_memberships": {
          // Add case for organization memberships
          const organizationMemberships = JSON.parse(data).map(
            (membership: { createdAt: string | number | Date }) => ({
              ...membership,
              createdAt: parseDate(membership.createdAt),
            })
          ) as (typeof schema.organizationMembershipsTable.$inferInsert)[];
          await db
            .insert(schema.organizationMembershipsTable)
            .values(organizationMemberships);
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
  } catch (err) {
    console.error("\x1b[31m", `Error adding data to tables: ${err}`);
  } finally {
    process.exit(0);
  }
}

/**
 * Parses a date string and returns a Date object. Returns null if the date is invalid.
 * @param date - The date string to parse
 * @returns The parsed Date object or null
 */
function parseDate(date: string | number | Date): Date | null {
  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * Checks record counts in specified tables after data insertion.
 * @returns {Promise<boolean>} - Returns true if data exists, false otherwise.
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

    console.log("\nRecord Counts After Import:\n");

    console.log(
      `${"| Table Name".padEnd(30)}| Record Count |
${"|".padEnd(30, "-")}|----------------|
`
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

const collections = ["users", "organizations", "organization_memberships"]; // Add organization memberships to collections

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

  const existingData = await checkCountAfterImport();
  if (existingData) {
    const { deleteExisting } = await inquirer.prompt([
      {
        type: "confirm",
        name: "deleteExisting",
        message:
          "Existing data found. Do you want to delete existing data and import the new data?",
        default: false,
      },
    ]);

    if (deleteExisting) {
      options.format = true;
    }
  }

  await insertCollections(options.items || collections, options);
})();
