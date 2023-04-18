import { PostResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: PostResolvers["creator"] = async (parent) => {
  return await User.find({
    _id: parent.creator,
  }).lean();
};
