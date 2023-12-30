import type { TransactionLogResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: TransactionLogResolvers["createdBy"] = async (
  parent
) => {
  return User.findOne({
    _id: parent.createdBy.toString(),
  }).lean();
};
