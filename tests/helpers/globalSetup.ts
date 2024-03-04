import { connect, disconnect, dropAllCollectionsFromDatabase } from "./db";

const resetDatabaseState = async (): Promise<void> => {
  const MONGO_INSTANCE = await connect();
  try {
    await dropAllCollectionsFromDatabase(MONGO_INSTANCE);
    await disconnect(MONGO_INSTANCE);
  } catch (e) {
    console.log("problem in reseting db", e);
  }
};

export async function setup(): Promise<void> {
  await resetDatabaseState();
}

export async function teardown(): Promise<void> {
  await resetDatabaseState();
}
