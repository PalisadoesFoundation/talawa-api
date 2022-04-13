const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Comment = require('../../models/Comment');
const {
  NOT_FOUND_COMMENT_CODE,
  NOT_FOUND_COMMENT_MESSAGE,
  NOT_FOUND_COMMENT_PARAM,
} = require('../../../constants');

module.exports = async () => {
  const commentFound = await Comment.find()
    .populate('creator', '-password')
    .populate('post')
    .populate('likedBy');
  if (!commentFound) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_COMMENT_MESSAGE),
      NOT_FOUND_COMMENT_CODE,
      NOT_FOUND_COMMENT_PARAM
    );
  }
  return commentFound;
};
