import { describe, expect, it, vi } from "vitest";
import { importData } from "../../src/setup/importData";
import * as shouldWipeExistingData from "../../src/setup/shouldWipeExistingData";

describe("importData", () => {
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
