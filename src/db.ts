import mongoose from "mongoose";
import { MONGO_DB_URL } from "./constants";
import { logger } from "./libraries";

export const connect = async (dbName: string | undefined = undefined) => {
  try {
    if (process.env.NODE_ENV === "testing" && !dbName) {
      logger.error(
        "You are running tests, but no testing database is provided."
      );
      process.exit(1);
    }

    const connectionOptions: mongoose.ConnectOptions = {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
      dbName: process.env.NODE_ENV === "testing" && dbName ? dbName : undefined,
    };

    await mongoose.connect(MONGO_DB_URL!, connectionOptions);
  } catch (error) {
    logger.error("Error while connecting to Mongo database.", error);
    process.exit(1);
  }
};

export const disconnect = async () => {
  await mongoose.connection.close();
};
