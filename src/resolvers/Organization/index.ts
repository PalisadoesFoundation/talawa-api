import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { admins } from "./admins";
import { blockedUsers } from "./blockedUsers";
import { creator } from "./creator";
import { image } from "./image";
import { members } from "./members";
import { membershipRequests } from "./membershipRequests";

export const Organization: OrganizationResolvers = {
  admins,
  blockedUsers,
  creator,
  image,
  members,
  membershipRequests,
};
