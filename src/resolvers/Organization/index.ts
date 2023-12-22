import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { admins } from "./admins";
import { blockedUsers } from "./blockedUsers";
import { createdBy } from "./createdBy";
import { image } from "./image";
import { members } from "./members";
import { pinnedPosts } from "./pinnedPosts";
import { membershipRequests } from "./membershipRequests";
import { updatedBy } from "./updatedBy";
// import { userTags } from "./userTags";

export const Organization: OrganizationResolvers = {
  admins,
  blockedUsers,
  createdBy,
  updatedBy,
  image,
  members,
  membershipRequests,
  pinnedPosts,
  // userTags,
};
