import mongoose from "mongoose";
import { logger } from "../libraries";

/**
 * Checks if the MongoDB connection is part of a replica set.
 * This function sends a 'hello' command to the MongoDB admin database to retrieve server information,
 * and determines if the connection is part of a replica set by checking for the presence of 'hosts' and 'setName' in the result.
 *
 * @returns A promise that resolves to a boolean indicating whether the connection is part of a replica set (true) or not (false).
 */
export const checkReplicaSet = async (): Promise<boolean> => {
  try {
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.command({
      hello: 1,
    });

    if ("hosts" in result && "setName" in result) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error("Error checking replica set configuration :", error);
    return false;
  }
};
