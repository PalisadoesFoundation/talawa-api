import mongoose from "mongoose";
import { MONGO_DB_URL } from "./constants";
import { logger } from "./libraries";
import { checkReplicaSet } from "./utilities/checkReplicaSet";

let session!: mongoose.ClientSession;

export const connect = async (dbName?: string): Promise<void> => {
  // firstly we check if a connection to the database already exists.
  if (mongoose.connection.readyState !== 0) {
    // if the connection state is not 0, it means a connection already exists so we return.
    return;
  }
  // if no connection exists, we try to establish a new connection.
  try {
    await mongoose.connect(MONGO_DB_URL as string, {
      dbName,
    });
    const replicaSet = await checkReplicaSet();
    if (replicaSet) {
      logger.info("Session started --> Connected to a replica set!");
      session = await mongoose.startSession();
    } else {
      logger.info("Session not started --> Not Connected to a replica set!");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorMessage = error.toString();
      if (errorMessage.includes("ECONNREFUSED")) {
        logger.error("\n\n\n\x1b[1m\x1b[31m%s\x1b[0m", error);
        logger.error(
          "\n\n\x1b[1m\x1b[34m%s\x1b[0m",
          `- Connection to MongoDB failed: There are several potential causes for this issue, including:`,
        );
        logger.error(
          "\x1b[1m\x1b[33m%s\x1b[0m",
          `- Unstable Network Connection`,
        );
        logger.error("\x1b[1m\x1b[33m%s\x1b[0m", `- Invalid Connection String`);
        logger.error(
          "\x1b[1m\x1b[33m%s\x1b[0m",
          `- MongoDB Server may not be running`,
        );
        logger.error(
          "\x1b[1m\x1b[33m%s\x1b[0m",
          `- Firewall may not be configured to allow incoming connections on MongoDB port.`,
        );
        logger.error(
          "\x1b[1m\x1b[31m%s\x1b[0m",
          `- Please try again with the fixes !`,
        );
      } else {
        logger.error("Error while connecting to mongo database", error);
      }
      process.exit(1);
    }
  }
};

export const disconnect = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    logger.warn("No active database connection to disconnect.");
    return;
  }
  session?.endSession();
  await mongoose.connection.close();
};

export { session };
