import "dotenv/config";
import mongoose from "mongoose";

// Returns a mongoose instance to the testing database
export async function connect(
  dbName = "TALAWA_API_TEST_DATABASE",
): Promise<typeof mongoose> {
  console.log("before tests...");
  const client = await mongoose.connect(process.env.MONGO_DB_URL as string, {
    dbName,
  });
  console.log("after connect");
  return client;
}

export async function dropAllCollectionsFromDatabase(
  mongooseInstance: typeof mongoose,
): Promise<void> {
  const collections = await mongooseInstance.connection.db.collections();

  for (const collection of collections) {
    await collection.drop();
  }
}

export async function dropDatabase(
  mongooseInstance: typeof mongoose,
): Promise<void> {
  await mongooseInstance.connection.db.dropDatabase();
}

// Disconnects from the provided mongoose instance
export async function disconnect(
  mongooseInstance: typeof mongoose,
): Promise<void> {
  await mongooseInstance.connection.close();
}
