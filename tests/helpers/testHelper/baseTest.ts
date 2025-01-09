import mongoose from "mongoose";
import { TestHelper } from "./testHelper";

export class BaseTest {
  private _testHelper: TestHelper;
  private _testId: string;

  constructor() {
    this._testHelper = TestHelper.getInstance();
    this._testId = Math.random().toString(36).substring(7); // Unique test ID
  }

  /**
   * Runs before all tests to start the database.
   */
  async beforeAll(): Promise<void> {
    await this._testHelper.startDatabase();
  }

  /**
   * Creates isolated test data before each test.
   * @returns Test user and organization data.
   */
  async beforeEach(): Promise<{
    testUser: { name: string; email: string };
    testOrg: { name: string };
  }> {
    const testData = TestHelper.createTestData(this._testId);
    return testData;
  }

  /**
   * Cleans up the database after each test.
   */
  async afterEach(): Promise<void> {
    try {
      await mongoose.connection.dropDatabase();
    } catch (error) {
      console.error(`Failed to drop database: ${(error as Error).message}`);
    }
  }

  /**
   * Stops the database after all tests.
   */
  async afterAll(): Promise<void> {
    await this._testHelper.stopDatabase();
  }
}
