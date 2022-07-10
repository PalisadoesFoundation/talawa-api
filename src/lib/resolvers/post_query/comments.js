const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const { Comment } = require('../../models');

module.exports = async () => {
  const commentFound = await Comment.find()
    .populate('creator', '-password')
    .populate('post')
    .populate('likedBy');
  if (!commentFound) {
    throw new NotFoundError(
      requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }
  return commentFound;
};
