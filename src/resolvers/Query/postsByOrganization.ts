import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";

/**
 * This query will fetch the list of all post within an Organization from database.
 * @param _parent -
 * @param args - An object that contains `id` of the organization, `orderBy` fields.
 * @returns An object that contains the Post.
 * @remarks The query function uses `getSort()` function to sort the data in specified order.
 */

export const postsByOrganization: QueryResolvers["postsByOrganization"] =
  async (_parent, args, context) => {
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
      imageUrl: post.imageUrl ? `${context.apiRootUrl}${post.imageUrl}` : null,
    }));

    return postsWithImageURLResolved;
  };
