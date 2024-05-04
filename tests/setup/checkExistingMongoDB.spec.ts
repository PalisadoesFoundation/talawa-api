import { expect, it, describe, vi, afterEach } from "vitest";
import { checkConnection, checkExistingMongoDB } from "../../src/setup/MongoDB";
import { MongoClient } from "mongodb";

describe("Setup -> checkExistingMongoDB", () => {
  afterEach(() => {
    // Clear all mocks after each test
    vi.restoreAllMocks();
  });
  it("should return the first valid URL when a connection is found", async () => {
    const result = await checkExistingMongoDB();
    expect(result).toBe(process.env.MONGO_DB_URL);
  });

  it("should return null if MONGO_DB_URL is not set", async () => {
    process.env.MONGO_DB_URL = "";
    const result = await checkExistingMongoDB();
    expect(result).toBeNull();
  });

  it("should return null if checkConnection returns false", async () => {
    // Set the environment variable
    process.env.MONGO_DB_URL = "mongodb://testUrl";

    // Spy on the checkConnection function to return false
    vi.spyOn(MongoClient, "connect").mockImplementation(() => {
      throw new Error("Test error");
    });

    // Call the function
    const result = await checkExistingMongoDB();

    // Check that the result is null
    expect(result).toBeNull();
  });

  it("should return false and log error when connection fails", async () => {
    // Spy on the MongoClient.connect function to throw an error
    vi.spyOn(MongoClient, "connect").mockImplementation(() => {
      throw new Error("Test error");
    });

    // Call the function with a test URL
    const result = await checkConnection("mongodb://testUrl");

    // Check that the result is false
    expect(result).toBe(false);
  });

  it("should return false and log error when connection fails with unknown error type", async () => {
    // Spy on the MongoClient.connect function to throw an Non-Error
    vi.spyOn(MongoClient, "connect").mockImplementation(() => {
      throw "Test error";
    });

    // Call the function with a test URL
    const result = await checkConnection("mongodb://testUrl");

    // Check that the result is false
    expect(result).toBe(false);
  });
  it("should return the first valid URL when a connection is found", async () => {
    process.env.MONGO_DB_URL = "mongodb://localhost:27017/talawa-api";
    const result = await checkExistingMongoDB();
    expect(result).toBe(process.env.MONGO_DB_URL);
  });
});
