import "dotenv/config";
import yargs from "yargs";
import fs from "fs/promises";
import path from "path";
import { connect } from "../db";
import { User, Organization, Event, Post } from "../models";

interface InterfaceArgs {
  items?: string;
  format?: boolean;
  _: unknown;
}

async function formatDatabase(): Promise<void> {
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Event.deleteMany({}),
    Post.deleteMany({}),
  ]);
  console.log("Cleared all collections\n");
}

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

    // Check if specific collections need to be inserted
    if (format) {
      await formatDatabase();
    }

    for (const collection of collections) {
      const data = await fs.readFile(
        path.join(__dirname, `../../sample_data/${collection}.json`),
        "utf8"
      );
      const docs = JSON.parse(data) as Record<string, unknown>[];

      switch (collection) {
        case "users":
          await User.insertMany(docs);
          break;
        case "organizations":
          await Organization.insertMany(docs);
          break;
        case "events":
          await Event.insertMany(docs);
          break;
        case "posts":
          await Post.insertMany(docs);
          break;
        default:
          console.log("\x1b[31m", `Invalid collection name: ${collection}`);
          break;
      }

      console.log("\x1b[35m", `Added ${collection} collection`);
    }

    console.log("\nCollections added successfully");
  } catch (err) {
    console.error("\x1b[31m", `Error adding collections: ${err}`);
  } finally {
    process.exit(0);
  }
}

// Default collections available to insert
const collections = ["users", "organizations", "posts", "events"];

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

if (argvItems) {
  const specificCollections = argvItems.split(",");
  insertCollections(specificCollections);
} else {
  insertCollections(collections);
}
