import { TestHelper } from "./testHelper";
import mongoose from "mongoose";
import { config } from "dotenv";

config(); // Load environment variables from .env

export class BaseTest {
  protected testId: string;

  constructor() {
    this.testId = Math.random().toString(36).substring(7);
  }

  // Setup method before each test
  async beforeEach(): Promise<{
    testUser: { name: string; email: string };
    testOrg: { name: string };
  }> {
    const dbUri = process.env.MONGO_DB_URL;
    if (!dbUri) {
      throw new Error("MONGO_DB_URL is not set in the .env file.");
    }

    console.log(`Connecting to MongoDB: ${dbUri}`);
    await mongoose.connect(dbUri); // Connect to MongoDB using the URI from .env
    return TestHelper.createTestData(this.testId); // Create isolated test data
  }

  // Cleanup method after each test
  async afterEach(): Promise<void> {
    console.log("Dropping test database and closing connection...");
    await mongoose.connection.dropDatabase(); // Drop the test database
    await mongoose.connection.close(); // Close the connection
  }
}
