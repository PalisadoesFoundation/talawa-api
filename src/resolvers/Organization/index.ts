import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { admins } from "./admins";
import { blockedUsers } from "./blockedUsers";
import { creator } from "./creator";
import { members } from "./members";
import { pinnedPosts } from "./pinnedPosts";
import { membershipRequests } from "./membershipRequests";

export const Organization: OrganizationResolvers = {
  admins,
  blockedUsers,
  creator,
  members,
  membershipRequests,
  pinnedPosts,
};
