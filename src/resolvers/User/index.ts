import { UserResolvers } from "../../types/generatedGraphQLTypes";
import { membershipRequests } from "./membershipRequests";
// import { tagsAssignedWith } from "./tagsAssignedWith";

export const User: UserResolvers = {
  // tagsAssignedWith,
  membershipRequests
};
