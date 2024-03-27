import path from "path";
import {
  Organization,
  Post,
  User,
  Event,
  AppUserProfile,
  Community,
  ActionItemCategory,
} from "../models";
import fs from "fs";
import dotenv from "dotenv";
import * as yargs from "yargs";
import { connect, disconnect } from "../db";

interface InterfaceArgs {
  items?: string;
  format?: boolean;
  _: unknown;
}

export async function formatDatabase(): Promise<void> {
  await Promise.all([
    Community.deleteMany({}),
    User.deleteMany({}),
    Organization.deleteMany({}),
    ActionItemCategory.deleteMany({}),
    Event.deleteMany({}),
    Post.deleteMany({}),
    AppUserProfile.deleteMany({}),
  ]);
  console.log("Cleared all collections\n");
}

dotenv.config();
/**
 * The function which loads the default organization, so that there is always altleast 1 organization in the DB
 * @returns a Promise that resolves to void
 */

export async function loadDefaultOrganization(
  url: string | undefined,
  dbName?: string,
): Promise<void> {
  if (url == null) {
    console.log("Couldn't find mongodb url");
    return;
  }
  await connect(dbName);

  const args = yargs
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
  if (args.format) {
    await formatDatabase();
  }
  const userData = await fs.readFileSync(
    path.join(__dirname, `../../sample_data/defaultOrganizationAdmin.json`),
    "utf8",
  );
  const userDocs = JSON.parse(userData) as Record<string, unknown>[];
  await User.insertMany(userDocs);
  const data = await fs.readFileSync(
    path.join(__dirname, `../../sample_data/defaultOrganization.json`),
    "utf8",
  );
  const docs = JSON.parse(data) as Record<string, unknown>[];
  await Organization.insertMany(docs);
  const profileData = await fs.readFileSync(
    path.join(
      __dirname,
      `../../sample_data/defaultOrganizationAdminProfileId.json`,
    ),
    "utf8",
  );
  const profileDocs = JSON.parse(profileData) as Record<string, unknown>[];
  await AppUserProfile.insertMany(profileDocs);
  console.log("Default Organization loaded");
  await disconnect();
}
