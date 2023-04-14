import "dotenv/config";
import yargs from "yargs";
import { User, Organization, Event, Post } from "../models";
import { connect } from "../db";
import fs from "fs";
import path from "path";

// Required arguments that need to be parsed
yargs.option("i", {
  alias: "items",
  describe: "Comma-separated list of collections to load sample data into",
  type: "string",
});

yargs.option("f", {
  alias: "format",
  describe:
    "Formats all the collections present in the database before the insertion of objects. [WARNING] Use carefully.",
  type: "boolean",
});

// Parse arguments in synchronization
const argv: {
  items?: string;
  format?: boolean;
  _: unknown;
} = yargs.parseSync();

// Default collections available to insert
let collections = ["users", "organizations", "posts", "events"];
const argvItems = argv.items;

// Check if specific connections need to be inserted
if (argvItems) {
  collections = argvItems.split(",");
}

// Format database function
async function formatDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Event.deleteMany({}),
    Post.deleteMany({}),
  ]);
  console.log("Cleared all collections\n");
  //process.exit(1);
}

// Insert collections function
async function insertCollections(collections: Array<string>) {
  // Connect to MongoDB database
  await connect();

  // Check if database format is required
  if (argv.format) {
    await formatDatabase();
  }

  // Iterate over arguments and add to database
  for (const collection of collections) {
    const data = fs.readFileSync(
      path.join(__dirname, "sample_data", `${collection}.json`)
    );
    const docs = JSON.parse(data.toString());

    try {
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
    } catch (err) {
      console.error(
        "\x1b[31m",
        `Error adding ${collection} collection: ${err}`
      );
    }
  }

  console.log("\nCollections added successfully");
  process.exit(1);
}

// Calling the insert collections function
insertCollections(collections);
