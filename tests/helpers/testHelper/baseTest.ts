import { TestHelper } from "./testHelper";
import mongoose from "mongoose";
import { config } from "dotenv";

config(); // Load environment variables from .env

export class BaseTest {
  protected testId: string;

  constructor() {
    // Generate a unique ID for the test run
    this.testId = Math.random().toString(36).substring(7);
  }

  /**
   * Setup method to run before each test.
   * Connects to MongoDB and creates isolated test data.
   * @returns A Promise containing test user and organization data.
   */
  async beforeEach(): Promise<{
    testUser: { name: string; email: string };
    testOrg: { name: string };
  }> {
    const dbUri = process.env.MONGO_DB_URL;

    if (!dbUri) {
      throw new Error("MONGO_DB_URL is not set in the .env file.");
    }

    try {
      await mongoose.connect(dbUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
    } catch (error) {
      throw new Error(
        `Failed to connect to MongoDB: ${(error as Error).message}`,
      );
    }

    // Create isolated test data
    return TestHelper.createTestData(this.testId);
  }

  /**
   * Cleanup method to run after each test.
   * Drops the test database and closes the MongoDB connection.
   */
  async afterEach(): Promise<void> {
    try {
      // Drop the test database
      await mongoose.connection.dropDatabase();
    } catch (error) {
      console.error(`Failed to drop the database: ${(error as Error).message}`);
    } finally {
      // Ensure the connection is closed, even if dropping the database fails
      try {
        await mongoose.connection.close();
      } catch (error) {
        console.error(
          `Failed to close MongoDB connection: ${(error as Error).message}`,
        );
      }
    }
  }
}
