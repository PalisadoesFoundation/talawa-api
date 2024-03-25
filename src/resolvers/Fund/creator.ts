import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: FundResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
