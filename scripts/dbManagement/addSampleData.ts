import {
  askUserToContinue,
  disconnect,
  emptyMinioBucket,
  formatDatabase,
  insertCollections,
  validateSampleData,
  pingDB,
} from "./helpers";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Pruned to only collections with implemented handlers (see helpers.ts HandlerMap)
type Collection =
  | "users"
  | "organizations"
  | "events"
  | "recurring_events"
  | "recurrence_rules"
  | "event_attendees";

const collections: Collection[] = [
  "users",
  "organizations",
  "events",
  "recurring_events",
  "recurrence_rules",
  "event_attendees",
];

async function main() {
  let connectionSuccessful = false;
  try {
    connectionSuccessful = await pingDB();
    if (!connectionSuccessful) throw new Error("Database connection failed.");
    
    if (!(await validateSampleData(true))) {
      console.error("Error: Sample data validation failed. Aborting.");
      process.exit(1);
    }

    if (!(await askUserToContinue("⚠ This script will delete ALL data. Proceed?"))) {
      process.exit(0);
    }

    if (!(await formatDatabase())) throw new Error("Failed to format database.");
    if (!(await emptyMinioBucket())) throw new Error("Failed to empty MinIO bucket.");

    await insertCollections(collections);
    console.log("\x1b[32mSuccess: Sample Data seeded.\x1b[0m");
  } catch (error) {
    console.error(`\x1b[31mError: ${error instanceof Error ? error.message : error}\x1b[0m`);
    process.exit(1);
  } finally {
    if (connectionSuccessful) {
      await disconnect();
      console.log("\x1b[32mSuccess: Gracefully disconnected from the database\x1b[0m\n");
    }
  }
}

// Fix: Use path.normalize for cross-platform correctness
const normalizedPath = path.normalize(fileURLToPath(import.meta.url));
const normalizedEntry = path.normalize(process.argv[1] || "");

if (normalizedPath === normalizedEntry) {
  main();
}

export { main };
