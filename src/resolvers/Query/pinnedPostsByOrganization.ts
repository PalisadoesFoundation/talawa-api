import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";

export const pinnedPostsByOrganization: QueryResolvers["pinnedPostsByOrganization"] =
  async (_parent, args) => {
    return Post.find({
      organization: args.id,
      pinned: true,
    })
      .sort({ createdAt: -1 })
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
  };
