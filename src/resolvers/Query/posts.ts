import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";
/**
 * The query will fetch all the Posts in specified order from the database.
 * @param _parent
 * @param args - An object that contains `orderBy` field to get the data in specified order.
 * @returns An object `posts` containing a list of all the post in a specified order.
 * @remarks The query function uses `getSort()` function to sort the data in specified order.
 */
export const posts: QueryResolvers["posts"] = async (_parent, args) => {
  const sort = getSort(args.orderBy);

  let posts = await Post.find()
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

  posts = posts.map((post) => {
    post.likeCount = post.likedBy.length || 0;
    post.commentCount = post.comments.length || 0;
    return post;
  });

  return posts;
};
