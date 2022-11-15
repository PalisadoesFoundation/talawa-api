import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { requestContext, errors } from "../../libraries";
import { Comment, Organization } from "../../models";
import {
  COMMENT_NOT_FOUND,
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  POST_NOT_FOUND,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";

/**
 * This query will fetch all the comments for a Post from database.
 * @param _parent 
 * @param args - An object that contains `id` of the post.
 * @param _context 
 * @returns An object `comments` that contains all the comments for the Post.
 * @remarks You can learn about GraphQL `Resolvers` 
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const commentsByPost: QueryResolvers["commentsByPost"] = async (
  _parent,
  args,
  _context
) => {
  const comments = await Comment.find({
    post: args.id,
  })
    .populate("creator", "-password")
    .populate("post")
    .populate("likedBy")
    .lean();

  // Throws error if comments list is empty.
  if (comments.length === 0) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? COMMENT_NOT_FOUND
        : requestContext.translate(COMMENT_NOT_FOUND_MESSAGE),
      COMMENT_NOT_FOUND_CODE,
      COMMENT_NOT_FOUND_PARAM
    );
  }

  // Throws error if no user exists for comments[0].creator.
  if (!comments[0].creator) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Throws error if no post exists for comments[0].post.
  if (!comments[0].post) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? POST_NOT_FOUND
        : requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }
  // Throws error if no organization exists for comments[0].post.organization.
  const organizationExists = await Organization.exists({
    _id: comments[0].post.organization,
  });

  if (organizationExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  return comments;
};
