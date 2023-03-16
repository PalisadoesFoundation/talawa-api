import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { usersAssignedTo } from "./usersAssignedTo";
import { childTags } from "./childTags";
import { organization } from "./organization";
import { parentTag } from "./parentTag";

export const UserTag: UserTagResolvers = {
  usersAssignedTo,
  childTags,
  organization,
  parentTag,
};
