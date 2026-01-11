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

// Pruned to only collections that have implemented handlers to avoid silent skip warnings
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

  console.log(
    `\x1b[33m\n⚠ WARNING: This script will delete all data in your database and MinIO bucket.\x1b[0m`,
  );

  try {
    connectionSuccessful = await pingDB();
    if (!connectionSuccessful) throw new Error("Database connection failed.");
    
    console.log("\n\x1b[32mSuccess: Database connected successfully\x1b[0m");

    const isValid = await validateSampleData(true);
    if (!isValid) {
      console.error("\x1b[31mError: Sample data validation failed. Aborting.\x1b[0m");
      process.exit(1);
    }

    const userConfirmed = await askUserToContinue("Are you sure you want to proceed?");
    if (!userConfirmed) {
      console.log("\x1b[31mOperation cancelled by user.\x1b[0m");
      process.exit(0);
    }

    const formatted = await formatDatabase();
    if (!formatted) throw new Error("Failed to format database.");

    const emptied = await emptyMinioBucket();
    if (!emptied) throw new Error("Failed to empty MinIO bucket.");

    await insertCollections(collections);

    console.log("\n\x1b[32mSuccess: Sample Data added to the database\x1b[0m\n");
  } catch (error) {
    console.error(`\x1b[31mError: ${error instanceof Error ? error.message : error}\x1b[0m`);
    process.exit(1);
  } finally {
    if (connectionSuccessful) {
      await disconnect();
      // Past tense fix: "Disconnected"
      console.log("\x1b[32mSuccess: Gracefully disconnected from the database\x1b[0m\n");
    }
  }
}

// Fixed: Windows-safe normalization for direct execution check
const normalizedPath = path.normalize(fileURLToPath(import.meta.url));
const normalizedEntry = path.normalize(process.argv[1] || "");

if (normalizedPath === normalizedEntry) {
  main();
}

export { main };
