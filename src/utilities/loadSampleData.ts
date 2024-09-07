import fs from "fs/promises";
import path from "path";
import yargs from "yargs";
import { connect } from "../db";
import {
  ActionItemCategory,
  AgendaCategoryModel,
  AppUserProfile,
  Community,
  Event,
  Organization,
  Post,
  User,
} from "../models";
import { RecurrenceRule } from "../models/RecurrenceRule";

interface InterfaceArgs {
  items?: string;
  format?: boolean;
  _: unknown;
}

/**
 * Lists sample data files and their document counts in the sample_data directory.
 */
async function listSampleData(): Promise<void> {
  try {
    const sampleDataPath = path.join(__dirname, "../../sample_data");
    const files = await fs.readdir(sampleDataPath);

    console.log("Sample Data Files:\n");

    console.log(
      "| File Name".padEnd(30) +
        "| Document Count |\n" +
        "|".padEnd(30, "-") +
        "|----------------|\n",
    );

    for (const file of files) {
      const filePath = path.join(sampleDataPath, file);
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
 * Clears all collections in the database.
 */
async function formatDatabase(): Promise<void> {
  // Clear all collections
  await Promise.all([
    Community.deleteMany({}),
    User.deleteMany({}),
    Organization.deleteMany({}),
    ActionItemCategory.deleteMany({}),
    AgendaCategoryModel.deleteMany({}),
    Event.deleteMany({}),
    Post.deleteMany({}),
    AppUserProfile.deleteMany({}),
    RecurrenceRule.deleteMany({}),
  ]);
  console.log("Cleared all collections\n");
}

/**
 * Inserts data into specified collections.
 * @param collections - Array of collection names to insert data into
 */
async function insertCollections(collections: string[]): Promise<void> {
  try {
    // Connect to MongoDB database
    await connect();

    const { format } = yargs
      .options({
        items: {
          alias: "i",
          describe:
            "Comma-separated list of collections to load sample data into",
          type: "string",
        },
        format: {
          alias: "f",
          describe:
            "Formats all the collections present in the database before the insertion of objects. [WARNING] Use carefully.",
          type: "boolean",
        },
      })
      .parseSync() as InterfaceArgs;

    // Check if formatting is requested
    if (format) {
      await formatDatabase();
    }

    // Insert data into each specified collection
    for (const collection of collections) {
      const data = await fs.readFile(
        path.join(__dirname, `../../sample_data/${collection}.json`),
        "utf8",
      );
      const docs = JSON.parse(data) as Record<string, unknown>[];

      switch (collection) {
        case "users":
          await User.insertMany(docs);
          break;
        case "organizations":
          await Organization.insertMany(docs);
          break;
        case "actionItemCategories":
          await ActionItemCategory.insertMany(docs);
          break;
        case "agendaCategories":
          await AgendaCategoryModel.insertMany(docs);
          break;
        case "events":
          await Event.insertMany(docs);
          break;
        case "recurrenceRules":
          await RecurrenceRule.insertMany(docs);
          break;
        case "posts":
          await Post.insertMany(docs);
          break;
        case "appUserProfiles":
          await AppUserProfile.insertMany(docs);
          break;
        default:
          console.log("\x1b[31m", `Invalid collection name: ${collection}`);
          break;
      }

      console.log("\x1b[35m", `Added ${collection} collection`);
    }

    // Check document counts after import
    await checkCountAfterImport();

    console.log("\nCollections added successfully");
  } catch (err) {
    console.error("\x1b[31m", `Error adding collections: ${err}`);
  } finally {
    process.exit(0);
  }
}

/**
 * Checks document counts in specified collections after data insertion.
 */
async function checkCountAfterImport(): Promise<void> {
  try {
    // Connect to MongoDB database
    await connect();

    const collections = [
      { name: "users", model: User },
      { name: "organizations", model: Organization },
      { name: "actionItemCategories", model: ActionItemCategory },
      { name: "agendaCategories", model: AgendaCategoryModel },
      { name: "events", model: Event },
      { name: "recurrenceRules", model: RecurrenceRule },
      { name: "posts", model: Post },
      { name: "appUserProfiles", model: AppUserProfile },
    ];

    console.log("\nDocument Counts After Import:\n");

    // Table header
    console.log(
      "| Collection Name".padEnd(30) +
        "| Document Count |\n" +
        "|".padEnd(30, "-") +
        "|----------------|\n",
    );

    // Display document counts for each collection
    for (const { name, model } of collections) {
      const count = await model.countDocuments();
      console.log(`| ${name.padEnd(28)}| ${count.toString().padEnd(15)}|`);
    }
  } catch (err) {
    console.error("\x1b[31m", `Error checking document count: ${err}`);
  }
}

// Default collections available to insert
const collections = [
  "users",
  "organizations",
  "posts",
  "events",
  "recurrenceRules",
  "appUserProfiles",
  "actionItemCategories",
  "agendaCategories",
];

// Check if specific collections need to be inserted
const { items: argvItems } = yargs
  .options({
    items: {
      alias: "i",
      describe: "Comma-separated list of collections to load sample data into",
      type: "string",
    },
  })
  .parseSync() as InterfaceArgs;

(async (): Promise<void> => {
  if (argvItems) {
    const specificCollections = argvItems.split(",");
    await listSampleData();
    await insertCollections(specificCollections);
  } else {
    await listSampleData();
    await insertCollections(collections);
  }
})();
