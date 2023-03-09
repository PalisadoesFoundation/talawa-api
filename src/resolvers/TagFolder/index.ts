import { TagFolderResolvers } from "../../types/generatedGraphQLTypes";
import { subfolders } from "./subfolders";
import { tags } from "./tags";

export const TagFolder: TagFolderResolvers = {
  subfolders,
  tags,
};
