const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const { addTenantId, tenantCtx } = require('../../helper_functions');

// const Comment = require('../../models/Comment');
const Organization = require('../../models/Organization');
const User = require('../../models/User');

const {
  COMMENT_NOT_FOUND,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_PARAM,

  POST_NOT_FOUND,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_PARAM,

  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,

  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,

  IN_PRODUCTION,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const { db, id, tenantId } = await tenantCtx(args.id);
  const { Comment, Post } = db;
  const commentFound = await Comment.find({ post: id })
    .populate('creator', '-password', User)
    .populate('likedBy', '', User)
    .populate('post', '', Post);
  //comment does not exist
  if (!commentFound.length) {
    throw new NotFoundError(
      process.env.NODE_ENV !== IN_PRODUCTION
        ? COMMENT_NOT_FOUND
        : requestContext.translate(COMMENT_NOT_FOUND_MESSAGE),
      COMMENT_NOT_FOUND_CODE,
      COMMENT_NOT_FOUND_PARAM
    );
  }
  //user does not exist
  if (!commentFound[0].creator) {
    throw new NotFoundError(
      process.env.NODE_ENV !== IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }
  //post does not exist
  if (!commentFound[0].post) {
    throw new NotFoundError(
      process.env.NODE_ENV !== IN_PRODUCTION
        ? POST_NOT_FOUND
        : requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }
  //organization does not exist
  const org = await Organization.find({
    _id: commentFound[0].post.organization,
  });
  if (!org.length) {
    throw new NotFoundError(
      process.env.NODE_ENV !== IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  for (let i = 0; i < commentFound.length; i++) {
    commentFound[i]._doc._id = addTenantId(commentFound[i]._id, tenantId);
  }
  return commentFound;
};
