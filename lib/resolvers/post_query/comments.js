// const { NotFoundError } = require('errors');
// const requestContext = require('talawa-request-context');

const Comment = require('../../models/Comment');

// const {
//   COMMENT_NOT_FOUND,
//   COMMENT_NOT_FOUND_MESSAGE,
//   COMMENT_NOT_FOUND_CODE,
//   COMMENT_NOT_FOUND_PARAM,
//   IN_PRODUCTION,
// } = require('../../../constants');

module.exports = async () => {
  const commentFound = await Comment.find()
    .populate('creator', '-password')
    .populate('post')
    .populate('likedBy');

  // THE ERROR CASE IS NOT POSSIBLE AS QUERY WILL RETURN EMPTY ARRAY
  //
  // if (!commentFound) {
  //   throw new NotFoundError(
  //     !IN_PRODUCTION
  //       ? COMMENT_NOT_FOUND
  //       : requestContext.translate(COMMENT_NOT_FOUND_MESSAGE),
  //     COMMENT_NOT_FOUND_CODE,
  //     COMMENT_NOT_FOUND_PARAM
  //   );
  // }
  return commentFound;
};
