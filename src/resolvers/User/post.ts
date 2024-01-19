import { Post } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the post created by the user from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An array which conatins the post created by the user.
 */

export const post: UserResolvers["post"] = async (parent) => {
  const post = await Post.find({
    createrId: parent._id,
  }).lean();

  return post;
};
