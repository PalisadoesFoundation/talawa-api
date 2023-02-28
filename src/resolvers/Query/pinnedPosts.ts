import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";

export const pinnedPosts: QueryResolvers["pinnedPosts"] = async (_parent) => {
  let posts = await Post.find({ pinned: true })
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

  posts = posts.map((post) => {
    post.likeCount = post.likedBy.length || 0;
    post.commentCount = post.comments.length || 0;
    return post;
  });

  return posts;
};
