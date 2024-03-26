import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { Types } from "mongoose";

export const creator: FundResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: new Types.ObjectId(parent.creatorId?.toString()),
  }).lean();
};
