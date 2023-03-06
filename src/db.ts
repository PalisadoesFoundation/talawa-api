import mongoose from "mongoose";
import { MONGO_DB_URL } from "./constants";
import { logger } from "./libraries";

export const connect = async () => {
  try {
    await mongoose.connect(MONGO_DB_URL!, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
    });
  } catch (error) {
    const errorMessage = error.toString();
    if (errorMessage.includes("ECONNREFUSED")) {
      logger.error("\n\n\n\x1b[1m\x1b[31m%s\x1b[0m",error);
      console.log("\n\n\x1b[1m\x1b[34m%s\x1b[0m",`- Connection to MongoDB failed: This may have caused due to-`);
      console.log("\x1b[1m\x1b[33m%s\x1b[0m",`- Network Issues`);
      console.log("\x1b[1m\x1b[33m%s\x1b[0m",`- Invalid Connection String`);
      console.log("\x1b[1m\x1b[33m%s\x1b[0m",`- MongoDB Server is not running`);
      console.log("\x1b[1m\x1b[33m%s\x1b[0m",`- Please check your internet connection and ensure that your database is configured correctly.`);
    }
    else{
    logger.error("Error while connecting to mongo database", error);
    }
    process.exit(1);
  }
};

export const disconnect = async () => {
  await mongoose.connection.close();
};
