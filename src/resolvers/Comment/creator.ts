import type { CommentResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `creator` field of a `Comment`.
 *
 * This function retrieves the user who created a specific comment.
 *
 * @param parent - The parent object representing the comment. It contains information about the comment, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the comment.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see CommentResolvers - The type definition for the resolvers of the Comment fields.
 *
 */
export const creator: CommentResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
