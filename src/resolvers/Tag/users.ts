import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { Tag } from "../../models";

export const users: TagResolvers["users"] = async (parent) => {
  return await Tag.find({
    _id: parent._id,
  })
    .select({
      users: 1,
    })
    .populate("users")
    .lean();
};
