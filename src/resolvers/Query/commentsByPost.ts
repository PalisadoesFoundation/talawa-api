import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Comment } from "../../models";

/**
 * This query fetch the Comment as a transaction for an organization from database.
 * @param _parent-
 * @param args - An object that contains `orgId` of the Organization.
 * @returns A `Comment` object.
 */
export const commentsByPost: QueryResolvers["commentsByPost"] = async (
  _parent,
  args
) => {
  return await Comment.find({
    postId: args.id,
  }).lean();
};
