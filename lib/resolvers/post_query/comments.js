const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Comment = require('../../models/Comment');

module.exports = async () => {
  const commentFound = await Comment.find()
    .populate('creator', '-password')
    .populate('post')
    .populate('likedBy');
  if (!commentFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Comment not found'
        : requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }
  return commentFound;
};
