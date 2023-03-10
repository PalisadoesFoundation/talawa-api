import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { Tag } from "../../models";

export const childTags: TagResolvers["childTags"] = async (parent) => {
  return await Tag.find({
    parentTag: parent._id,
  }).lean()!;
};
