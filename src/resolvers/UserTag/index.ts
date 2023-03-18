import { UserTagResolvers } from "../../types/generatedGraphQLTypes";

import { organization } from "./organization";
import { parentTag } from "./parentTag";
import { usersAssignedTo } from "./usersAssignedTo";

export const UserTag: UserTagResolvers = {
  organization,
  parentTag,
  usersAssignedTo,
};
