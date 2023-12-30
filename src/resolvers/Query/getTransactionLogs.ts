import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { TransactionLog } from "../../models/TransactionLog";

/**
 * This function returns list of plugins from the database.
 * @returns An object that contains a list of plugins.
 */
export const getTransactionLogs: QueryResolvers["getTransactionLogs"] =
  async () => {
    return await TransactionLog.find().lean();
  };
