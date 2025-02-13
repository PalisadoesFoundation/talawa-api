/**
 * Resets the database by clearing all existing data from collections.
 * This function ensures that all collections are emptied before seeding new data.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { connect } from "../db";
import {
  ActionItemCategory,
  AgendaCategoryModel,
  AppUserProfile,
  Event,
  Organization,
  Post,
  User,
  Venue,
} from "../models";
import { RecurrenceRule } from "../models/RecurrenceRule";

const dirname: string = path.dirname(fileURLToPath(import.meta.url));

const collections = [
  "users",
  "organizations",
  "posts",
  "events",
  "venue",
  "recurrenceRules",
  "appUserProfiles",
  "actionItemCategories",
  "agendaCategories",
];

/**
 * Deletes all documents from the collections to reset the database.
 */
async function resetDatabase(): Promise<void> {
  await connect("talawa-api");

  if ((await User.countDocuments()) > 0) await User.deleteMany({});
  if ((await Organization.countDocuments()) > 0)
    await Organization.deleteMany({});
  if ((await ActionItemCategory.countDocuments()) > 0)
    await ActionItemCategory.deleteMany({});
  if ((await AgendaCategoryModel.countDocuments()) > 0)
    await AgendaCategoryModel.deleteMany({});
  if ((await Event.countDocuments()) > 0) await Event.deleteMany({});
  if ((await Venue.countDocuments()) > 0) await Venue.deleteMany({});
  if ((await RecurrenceRule.countDocuments()) > 0)
    await RecurrenceRule.deleteMany({});
  if ((await Post.countDocuments()) > 0) await Post.deleteMany({});
  if ((await AppUserProfile.countDocuments()) > 0)
    await AppUserProfile.deleteMany({});

  console.log("Database reset completed.");
}

/**
 * Seeds the database with sample data from JSON files.
 */
async function seedDatabase(collections: string[]): Promise<void> {
  try {
    await resetDatabase();
    for (const collection of collections) {
      const data = await fs.readFile(
        path.resolve(dirname, `../../sample_data/${collection}.json`),
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
        case "venue":
          await Venue.insertMany(docs);
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
    console.log("\nCollections added successfully");
  } catch (err) {
    console.error("\x1b[31m", `Error adding collections: ${err}`);
  } finally {
    process.exit(0);
  }
}

/**
 * Executes the database reset and seed process.
 */
(async (): Promise<void> => {
  await seedDatabase(collections);
})();
