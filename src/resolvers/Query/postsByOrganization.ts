import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { BASE_URL } from "../../constants";

export const postsByOrganization: QueryResolvers["postsByOrganization"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    const postsInOrg = await Post.find({
      organization: args.id,
    })
      .sort(sort)
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

    const postsWithImageURLResolved = postsInOrg.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));

    return postsWithImageURLResolved;
  };
