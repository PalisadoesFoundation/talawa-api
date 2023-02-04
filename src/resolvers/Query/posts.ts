import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { getSort } from "./helper_funtions/getSort";

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
