import { TagFolderResolvers } from "../../types/generatedGraphQLTypes";
import { TagFolder } from "../../models";

export const subfolders: TagFolderResolvers["subfolders"] = async (parent) => {
  return await TagFolder.find({
    parent: parent._id,
  }).lean();
};
