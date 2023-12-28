import type { Types } from "mongoose";
import { TransactionLog } from "../models/TransactionLog";

/**
 * store the transcation in the TransactionLog collection
 * @remarks
 * This is a utility method.
 * @param createdBy - user responisible for creating the transaction.
 * @param type - type of transaction
 * @param modelName - model name in the database which was changed
 * @message - transaction message
 */
export const storeTransaction = async (
  createdBy: string | Types.ObjectId,
  type: string,
  modelName: string,
  message: string
): Promise<void> => {
  await TransactionLog.create({
    createdBy,
    type,
    modelName,
    message,
  });
};
