import mongoose from "mongoose";
import { logger } from "../libraries";

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
