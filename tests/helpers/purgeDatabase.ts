import { connect, disconnect, dropAllCollectionsFromDatabase } from "./db";

const purgeDatabase = async () => {
  const MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  await disconnect(MONGOOSE_INSTANCE);
};

purgeDatabase();
