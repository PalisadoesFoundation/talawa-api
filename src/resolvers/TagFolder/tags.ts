import { TagFolderResolvers } from "../../types/generatedGraphQLTypes";
import { Tag } from "../../models";

export const tags: TagFolderResolvers["tags"] = async (parent) => {
  return await Tag.find({
    parent: parent._id,
  }).lean();
};
