import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { childTags } from "./childTags";
import { organization } from "./organization";
import { parentTag } from "./parentTag";
import { ancestorTags } from "./ancestorTags";
import { usersAssignedTo } from "./usersAssignedTo";
import { usersToAssignTo } from "./usersToAssignTo";

export const UserTag: UserTagResolvers = {
  childTags,
  organization,
  parentTag,
  ancestorTags,
  usersAssignedTo,
  usersToAssignTo,
};
