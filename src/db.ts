import mongoose from "mongoose";
import { MONGO_DB_URL } from "./constants";
import { logger } from "./libraries";

export const connect = async () => {
  try {
    let CONNECTION_URL = MONGO_DB_URL;

    if (process.env.NODE_ENV === "testing") {
      CONNECTION_URL += "_TEST";
    }

    await mongoose.connect(CONNECTION_URL!, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
    });
  } catch (error) {
    logger.error("Error while connecting to mongo database", error);
    process.exit(1);
  }
};

export const disconnect = async () => {
  await mongoose.connection.close();
};
