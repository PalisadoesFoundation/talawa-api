import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { childTags } from "./childTags";
import { organization } from "./organization";
import { parentTag } from "./parentTag";
import { usersAssignedTo } from "./usersAssignedTo";

export const UserTag: UserTagResolvers = {
  childTags,
  organization,
  parentTag,
  usersAssignedTo,
};
