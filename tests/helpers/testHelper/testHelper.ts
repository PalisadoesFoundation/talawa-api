import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

export class TestHelper {
  private static _mongod: MongoMemoryServer;

  // Starts the in-memory database
  static async startDatabase(): Promise<void> {
    this._mongod = await MongoMemoryServer.create();
    const uri = this._mongod.getUri();
    await mongoose.connect(uri);
  }

  // Stops the in-memory database and cleans up
  static async stopDatabase(): Promise<void> {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this._mongod.stop();
  }

  // Creates a unique database for isolated tests
  static async createUniqueDatabase(): Promise<string> {
    const uniqueId = Math.random().toString(36).substring(7);
    const testDB = await MongoMemoryServer.create({
      instance: { dbName: `test_${uniqueId}` },
    });
    return testDB.getUri();
  }

  // Creates isolated test data
  static createTestData(prefix: string): {
    testUser: { name: string; email: string };
    testOrg: { name: string };
  } {
    return {
      testUser: { name: `${prefix}_user`, email: `${prefix}@test.com` },
      testOrg: { name: `${prefix}_org` },
    };
  }
}
