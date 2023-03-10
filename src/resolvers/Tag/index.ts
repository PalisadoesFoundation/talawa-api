import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { usersAssignedTo } from "./usersAssignedTo";
import { childTags } from "./childTags";
import { organization } from "./organization";
import { parentTag } from "./parentTag";

export const Tag: TagResolvers = {
  usersAssignedTo,
  childTags,
  organization,
  parentTag,
};
