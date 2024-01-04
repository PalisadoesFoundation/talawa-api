import type { Types } from "mongoose";
import * as fs from "fs";
import { TRANSACTION_LOG_PATH } from "../constants";

/**
 * store log for the database transaction
 * @remarks
 * This is a utility method.
 * @param createdBy - user responisible for creating the transaction
 * @param type - type of transaction
 * @param modelName - model name in the database which was changed
 * @message - transaction message
 */

export const storeTransaction = (
  createdBy: string | Types.ObjectId,
  type: string,
  modelName: string,
  message: string
): void => {
  const logPath = TRANSACTION_LOG_PATH as string;

  const timestamp = new Date().toISOString();
  const logMessage = `timestamp=${timestamp}, createdBy=${createdBy}, type=${type}, model=${modelName}, message=${message}\n`;
  fs.appendFile(logPath, logMessage, (err) => {
    if (err) {
      console.log("FAILED TO WRTIE TRANSACTION LOG", err);
    }
  });
};
