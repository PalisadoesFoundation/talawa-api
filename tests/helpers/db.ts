import "dotenv/config";
import mongoose from "mongoose";

// Returns a mongoose instance to the testing database
export async function connect(dbName: string = "TALAWA_API_TEST_DATABASE") {
  return await mongoose.connect(process.env.MONGO_DB_URL as string, {
    dbName,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useNewUrlParser: true,
  });
}

export async function dropAllCollectionsFromDatabase(
  mongooseInstance: typeof mongoose
) {
  const collections = await mongooseInstance.connection.db.collections();

  for (const collection of collections) {
    await collection.drop();
  }
}

export async function dropDatabase(mongooseInstance: typeof mongoose) {
  await mongooseInstance.connection.db.dropDatabase();
}

// Disconnects from the provided mongoose instance
export async function disconnect(mongooseInstance: typeof mongoose) {
  await mongooseInstance.connection.close();
}
