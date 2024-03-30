import fs from "fs/promises";
import path from "path";
import { connect } from "../db";
import {
  ActionItemCategory,
  AppUserProfile,
  Community,
  Event,
  Organization,
  Post,
  User,
} from "../models";

async function formatDatabase(): Promise<void> {
  // Clear all collections
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
export async function loadDefaultOrganiation(): Promise<void> {
  try {
    await connect();
    await formatDatabase();
    const userData = await fs.readFile(
      path.join(__dirname, `../../sample_data/defaultUser.json`),
      "utf8",
    );
    const userDocs = JSON.parse(userData) as Record<string, unknown>[];
    await User.insertMany(userDocs);
    const appUserData = await fs.readFile(
      path.join(__dirname, `../../sample_data/defaultAppUserProfile.json`),
      "utf8",
    );
    const appUserDocs = JSON.parse(appUserData) as Record<string, unknown>[];
    await AppUserProfile.insertMany(appUserDocs);
    const organizationData = await fs.readFile(
      path.join(__dirname, `../../sample_data/defaultOrganization.json`),
      "utf8",
    );
    const organizationDocs = JSON.parse(organizationData) as Record<
      string,
      unknown
    >[];
    await Organization.insertMany(organizationDocs);
    console.log("Default organization loaded");
  } catch (error) {
    console.log(error);
  }
}
(async (): Promise<void> => {
  await loadDefaultOrganiation();
})();
