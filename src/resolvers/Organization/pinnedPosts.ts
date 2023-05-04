import { Post } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const pinnedPosts: OrganizationResolvers["pinnedPosts"] = async (
  parent
) => {
  return await Post.find({
    _id: {
      $in: parent.pinnedPosts,
    },
  }).lean();
};
