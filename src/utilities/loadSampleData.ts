import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

const dirname: string = path.dirname(fileURLToPath(import.meta.url));


const queryClient = postgres({
  host: process.env.API_POSTGRES_HOST,
  port: Number(process.env.API_POSTGRES_PORT),
  database: process.env.API_POSTGRES_DATABASE,
  username: process.env.API_POSTGRES_USER,
  password: process.env.API_POSTGRES_PASSWORD,
  ssl: process.env.API_POSTGRES_SSL_MODE === 'true',
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
      "| File Name".padEnd(30) +
        "| Document Count |\n" +
        "|".padEnd(30, "-") +
        "|----------------|\n",
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
 * Clears all tables in the database.
 */
async function formatDatabase(): Promise<void> {
  const tables = [
    schema.usersTable,
    schema.postsTable,
    schema.organizationsTable,
    // schema.eventsTable,
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
async function insertCollections(collections: string[], options: LoadOptions = {}): Promise<void> {
  try {
    if (options.format) {
      await formatDatabase();
    }

    for (const collection of collections) {
      const data = await fs.readFile(
        path.resolve(dirname, `../../sample_data/${collection}.json`),
        "utf8",
      );

      switch (collection) {
        case "users":
          const users = JSON.parse(data) as typeof schema.usersTable.$inferInsert[];
          await db.insert(schema.usersTable).values(users);
          break;
        case "organizations":
          const organizations = JSON.parse(data) as typeof schema.organizationsTable.$inferInsert[];
          await db.insert(schema.organizationsTable).values(organizations);
          break;
        case "posts":
          const posts = JSON.parse(data) as typeof schema.postsTable.$inferInsert[];
          await db.insert(schema.postsTable).values(posts);
          break;
        // case "events":
        //   await db.insert(schema.eventsTable).values(docs);
        //   break;
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
 * Checks record counts in specified tables after data insertion.
 */
async function checkCountAfterImport(): Promise<void> {
  try {
    const tables = [
      { name: "users", table: schema.usersTable },
      { name: "organizations", table: schema.organizationsTable },
      { name: "posts", table: schema.postsTable },
    ];

    console.log("\nRecord Counts After Import:\n");

    console.log(
      "| Table Name".padEnd(30) +
        "| Record Count |\n" +
        "|".padEnd(30, "-") +
        "|----------------|\n",
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

const collections = [
  "users",
  "organizations",
  "posts",
//   "events"
];

const args = process.argv.slice(2);
const options: LoadOptions = {
  format: args.includes('--format') || args.includes('-f'),
  items: undefined
};

const itemsIndex = args.findIndex(arg => arg === '--items' || arg === '-i');
if (itemsIndex !== -1 && args[itemsIndex + 1]) {
  const items = args[itemsIndex + 1];
  options.items = items ? items.split(',') : undefined;
}

(async (): Promise<void> => {
  await listSampleData();
  await insertCollections(options.items || collections, options);
})();