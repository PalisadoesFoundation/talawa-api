import { MembershipRequestResolvers } from "../../../generated/graphqlCodegen";
import { organization } from "./organization";
import { user } from "./user";

export const MembershipRequest: MembershipRequestResolvers = {
  organization,
  user,
};
