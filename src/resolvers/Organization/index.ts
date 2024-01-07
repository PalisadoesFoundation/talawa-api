import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { admins } from "./admins";
import { blockedUsers } from "./blockedUsers";
import { creatorId } from "./creatorId";
import { image } from "./image";
import { members } from "./members";
import { pinnedPosts } from "./pinnedPosts";
import { membershipRequests } from "./membershipRequests";
// import { userTags } from "./userTags";

export const Organization: OrganizationResolvers = {
  admins,
  blockedUsers,
  creatorId,
  image,
  members,
  membershipRequests,
  pinnedPosts,
  // userTags,
};
