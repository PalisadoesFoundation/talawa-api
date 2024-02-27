import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { actionItemCategories } from "./actionItemCategories";
import { admins } from "./admins";
import { agendaCategories } from "./agendaCategories";
import { blockedUsers } from "./blockedUsers";
import { creator } from "./creator";
import { funds } from "./funds";
import { image } from "./image";
import { members } from "./members";
import { membershipRequests } from "./membershipRequests";
import { pinnedPosts } from "./pinnedPosts";
// import { userTags } from "./userTags";

export const Organization: OrganizationResolvers = {
  admins,
  actionItemCategories,
  agendaCategories,
  blockedUsers,
  creator,
  image,
  members,
  membershipRequests,
  pinnedPosts,
  funds,
  // userTags,
};
