import type { TransactionLogResolvers } from "../../types/generatedGraphQLTypes";
import { createdBy } from "./createdBy";

export const TransactionLog: TransactionLogResolvers = {
  createdBy,
};
