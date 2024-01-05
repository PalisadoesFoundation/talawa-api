import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { admins } from "./admins";
import { blockedUsers } from "./blockedUsers";
import { creator } from "./creator";
import { image } from "./image";
import { members } from "./members";
import { pinnedPosts } from "./pinnedPosts";
import { membershipRequests } from "./membershipRequests";
import { actionCategories } from "./actionCategories";
// import { userTags } from "./userTags";

export const Organization: OrganizationResolvers = {
  admins,
  actionCategories,
  blockedUsers,
  creator,
  image,
  members,
  membershipRequests,
  pinnedPosts,
  // userTags,
};
