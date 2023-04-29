import type { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { organization } from "./organization";
import { user } from "./user";

export const MembershipRequest: MembershipRequestResolvers = {
  organization,
  user,
};
