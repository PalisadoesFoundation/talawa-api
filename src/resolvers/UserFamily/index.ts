import type { UserFamilyResolvers } from "../../types/generatedGraphQLTypes";
import { users } from "./users";
import { admins } from "./admins";
import { creator } from "./creator";

export const UserFamily: UserFamilyResolvers = {
  users,
  admins,
  creator,
};
