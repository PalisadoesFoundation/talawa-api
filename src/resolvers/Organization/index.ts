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
import { posts } from "./posts";
import { advertisements } from "./advertisements";
import { userTags } from "./userTags";

import { venues } from "./venues";
// import { userTags } from "./userTags";

export const Organization: OrganizationResolvers = {
  admins,
  advertisements,
  actionItemCategories,
  agendaCategories,
  blockedUsers,
  creator,
  image,
  members,
  membershipRequests,
  pinnedPosts,
  funds,
  userTags,
  posts,
  venues,
};
