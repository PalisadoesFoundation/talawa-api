import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { usersAssignedTo } from "./usersAssignedTo";

export const UserTag: UserTagResolvers = {
  usersAssignedTo,
};
