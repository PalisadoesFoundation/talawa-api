import { describe, expect, it, vi } from "vitest";
import { importData } from "../../src/setup/importData";
import * as shouldWipeExistingData from "../../setup";

/*
  This test suite verifies the behavior of the importData function, which is responsible for importing data into the application's MongoDB database.
  It consists of multiple test cases to ensure different scenarios are covered.

  Test Case 1:
  Description: It should log a warning message if the MONGO_DB_URL environment variable is not set.
  Expected Behavior: When the MONGO_DB_URL is not set, the function should log a warning message indicating the absence of the MongoDB URL.

  Test Case 2:
  Description: It should import sample data if shouldWipeExistingData returns true.
  Expected Behavior: When shouldWipeExistingData returns true, indicating that existing data should be wiped, the function should import sample data and log an appropriate message.

  Test Case 3:
  Description: It should not import data if shouldWipeExistingData returns false.
  Expected Behavior: When shouldWipeExistingData returns false, indicating that existing data should not be wiped, the function should not import any data, and no logging message should be generated.

  Note: Each test case involves setting up the necessary environment variables, mocking dependencies, and asserting the expected behavior of the importData function.
*/
describe("Setup -> importData", () => {
  it("should log a warning message if MONGO_DB_URL is not set", async () => {
    process.env.MONGO_DB_URL = "";
    const consoleLogSpy = vi.spyOn(console, "log");
    await importData();
    expect(consoleLogSpy).toHaveBeenCalledWith("Couldn't find mongodb url");
  });

  it("should import sample data if shouldWipeExistingData returns true", async () => {
    process.env.MONGO_DB_URL = "mongodb://testUrl-new/talawa-api";
    const consoleLogSpy = vi.spyOn(console, "log");
    vi.spyOn(
      shouldWipeExistingData,
      "shouldWipeExistingData",
    ).mockImplementationOnce(() => Promise.resolve(true));

    await importData();

    expect(consoleLogSpy).toHaveBeenCalledWith("Importing sample data...");
  });

  it("should not import data if shouldWipeExistingData returns false", async () => {
    process.env.MONGO_DB_URL = "mongodb://testUrl-new/talawa-api";
    const consoleLogSpy = vi.spyOn(console, "log");
    vi.spyOn(
      shouldWipeExistingData,
      "shouldWipeExistingData",
    ).mockImplementationOnce(() => Promise.resolve(false));

    await importData();

    expect(consoleLogSpy).not.toHaveBeenCalledWith("Importing sample data...");
  });
});
