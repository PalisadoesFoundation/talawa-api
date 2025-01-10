import { connect, disconnect, dropAllCollectionsFromDatabase } from "./db";

const resetDatabaseState = async (): Promise<void> => {
  const MONGO_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGO_INSTANCE);
  await disconnect(MONGO_INSTANCE);
};

export async function setup(): Promise<void> {
  await resetDatabaseState();
}

export async function teardown(): Promise<void> {
  await resetDatabaseState();
}
