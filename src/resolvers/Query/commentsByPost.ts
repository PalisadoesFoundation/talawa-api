import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { Comment, Organization } from "../../models";
import {
  COMMENT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  POST_NOT_FOUND_ERROR,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";

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
      COMMENT_NOT_FOUND_ERROR.DESC,
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM
    );
  }

  // Throws error if no user exists for comments[0].creator.
  if (!comments[0].creator) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND,
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Throws error if no post exists for comments[0].post.
  if (!comments[0].post) {
    throw new errors.NotFoundError(
      POST_NOT_FOUND_ERROR.DESC,
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }
  // Throws error if no organization exists for comments[0].post.organization.
  const organizationExists = await Organization.exists({
    _id: comments[0].post.organization,
  });

  if (organizationExists === false) {
    throw new errors.NotFoundError(
      ORGANIZATION_NOT_FOUND_ERROR.DESC,
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  return comments;
};
