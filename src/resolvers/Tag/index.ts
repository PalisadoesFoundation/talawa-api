import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { assignedUsers } from "./assignedUsers";
import { childTags } from "./childTags";
import { organization } from "./organization";
import { parentTag } from "./parentTag";

export const Tag: TagResolvers = {
  assignedUsers,
  childTags,
  organization,
  parentTag,
};
