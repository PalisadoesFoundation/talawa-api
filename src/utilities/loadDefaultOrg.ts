import fs from "fs/promises";
import path from "path";
import { connect, disconnect } from "../db";
import { AppUserProfile, Organization, User } from "../models";

/**
 * Loads default organization data into the database.
 * @param dbName - Optional name of the database to connect to.
 * @returns Promise<void>
 */
export async function loadDefaultOrganiation(dbName?: string): Promise<void> {
  try {
    // Connect to the database
    await connect(dbName);

    // Read and insert default user data
    const userData = await fs.readFile(
      path.join(__dirname, `../../sample_data/defaultUser.json`),
      "utf8",
    );
    const userDocs = JSON.parse(userData) as Record<string, unknown>[];
    await User.insertMany(userDocs);

    // Read and insert default app user profile data
    const appUserData = await fs.readFile(
      path.join(__dirname, `../../sample_data/defaultAppUserProfile.json`),
      "utf8",
    );
    const appUserDocs = JSON.parse(appUserData) as Record<string, unknown>[];
    await AppUserProfile.insertMany(appUserDocs);

    // Read and insert default organization data
    const organizationData = await fs.readFile(
      path.join(__dirname, `../../sample_data/defaultOrganization.json`),
      "utf8",
    );
    const organizationDocs = JSON.parse(organizationData) as Record<
      string,
      unknown
    >[];
    await Organization.insertMany(organizationDocs);

    // Log success message
    console.log("Default organization loaded");
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);
  } finally {
    await disconnect(); // Close the database connection
  }
}
