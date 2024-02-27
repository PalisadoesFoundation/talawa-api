import { expect, describe, it, vi } from "vitest";
import { mongoDB } from "../../setup";
import * as module from "../../src/setup/MongoDB";
import inquirer from "inquirer";
import dotenv from "dotenv";
import fs from "fs";

/**
 * File: mongoDB.test.ts
 *
 * Overview:
 * This test file is part of the testing suite for the 'mongoDB' setup function
 * in the project's setup module. The 'mongoDB' function is responsible for configuring
 * the MongoDB connection settings based on user input or existing configurations.
 *
 * Purpose:
 * The purpose of this test file is to thoroughly validate the behavior of the 'mongoDB'
 * function under various scenarios, ensuring that it correctly handles both existing
 * and new MongoDB connection configurations.
 *
 * Test Cases:
 * - 'testing connection to existing MongoDB URL if confirmed':
 *   Verifies that the 'mongoDB' function connects to an existing MongoDB URL if the user
 *   confirms to keep the values.
 *
 * - 'should prompt for and connect to new URL if existing is not confirmed or unavailable':
 *   Verifies that the 'mongoDB' function prompts the user for a new MongoDB URL and connects
 *   if the existing URL is not confirmed or unavailable.
 *
 * Dependencies:
 * - vitest: Provides testing utilities such as 'describe', 'it', 'expect', 'vi', etc.
 * - inquirer: Used for prompting user input during testing.
 * - dotenv: Used for managing environment variables.
 * - fs: Used for file system operations.
 * - setup module: Contains the 'mongoDB' function to be tested.
 * - module: Contains utility functions related to MongoDB setup, such as checking existing
 *   configurations and establishing connections.
 *
 * Setup:
 * - Mocks are set up for inquirer prompts and filesystem operations to simulate user input
 *   and environment file reading.
 * - Spies are set up for relevant functions within the setup module to monitor their invocation
 *   and control their behavior during testing.
 *
 * Expectations:
 * - The test cases expect the 'mongoDB' function to correctly configure MongoDB connection
 *   settings based on user input or existing configurations.
 * - Environment variables related to MongoDB connection (e.g., MONGO_DB_URL) are expected to
 *   be set correctly after function execution.
 * - Console logs are expected to be appropriately generated based on function behavior.
 *
 * Result:
 * Upon successful execution of the test cases, it ensures that the 'mongoDB' function behaves
 * as expected, handling both existing and new MongoDB connection configurations accurately.
 */

describe("Setup -> mongoDB", () => {
  /**
   * Test case: testing connection to existing MongoDB URL if confirmed
   *
   * Description:
   * This test verifies that the `mongoDB` function connects to an
   * existing MongoDB URL if the user confirms to keep the values.
   */
  it("testing connection to existing MongoDB URL if confirmed", async () => {
    const existingUrl = "mongodb://testUrl";
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ keepValues: true });
    vi.spyOn(module, "checkExistingMongoDB").mockResolvedValueOnce(existingUrl);

    await mongoDB();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.MONGO_DB_URL).toEqual(existingUrl + "/talawa-api");
  });

  /**
   * Test case: testing connection to existing MongoDB URL if confirmed
   *
   * Description:
   * This test verifies that the `mongoDB` function connects to an
   * existing MongoDB URL if the user confirms to keep the values.
   */
  it("should prompt for and connect to new URL if existing is not confirmed or unavailable", async () => {
    vi.spyOn(module, "checkExistingMongoDB").mockImplementationOnce(() =>
      Promise.resolve(null),
    );
    const newUrl = "mongodb://testUrl-new";
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ keepValues: false });
    vi.spyOn(module, "askForMongoDBUrl").mockImplementationOnce(() =>
      Promise.resolve(newUrl),
    );
    vi.spyOn(module, "checkConnection").mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const consoleLogMock = vi.spyOn(console, "log");

    await mongoDB();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.MONGO_DB_URL).toEqual(newUrl + "/talawa-api");
    expect(consoleLogMock).not.toHaveBeenCalledWith("MongoDB URL detected:");
    expect(consoleLogMock).toHaveBeenCalledWith(
      "\nConnection to MongoDB successful! 🎉",
    );
  });

  it("should ask for MongoDB url, and return it", async () => {
    const url = "mongodb://localhost:27017/talawa-api";
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({
        url: url,
      }),
    );
    const result = await module.askForMongoDBUrl();
    expect(result).toEqual(url);
  });

  it("should return true for a successfull connection with MongoDB", async () => {
    const url = "mongodb://localhost:27017";
    const result = await module.checkConnection(url);
    expect(result).toEqual(true);
  });
});
