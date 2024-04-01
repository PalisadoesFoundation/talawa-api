import fs from "fs/promises";
import path from "path";
import { connect, disconnect } from "../db";
import { AppUserProfile, Organization, User } from "../models";

export async function loadDefaultOrganiation(dbName?: string): Promise<void> {
  try {
    await connect(dbName);
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
  } finally {
    await disconnect(); // Close the database connection
  }
}
