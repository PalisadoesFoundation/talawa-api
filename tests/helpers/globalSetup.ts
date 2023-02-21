import { connect, disconnect, dropAllCollectionsFromDatabase } from "./db";

const resetDatabaseState = async () => {
  const MONGO_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGO_INSTANCE);
  await disconnect(MONGO_INSTANCE);
};

export async function setup() {
  await resetDatabaseState();
}

export async function teardown() {
  await resetDatabaseState();
}
