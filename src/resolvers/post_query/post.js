const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Post = require('../../models/Post');

module.exports = async (parent, args) => {
  const postFound = await Post.findOne({
    _id: args.id,
  })
    .populate('organization')
    .populate({
      path: 'comments',
      populate: {
        path: 'creator',
      },
    })
    .populate('likedBy')
    .populate('creator', '-password');
  if (!postFound) {
    throw new NotFoundError(
      requestContext.translate('post.notFound'),
      'post.notFound',
      'post'
    );
  }
  postFound.likeCount = postFound.likedBy.length || 0;
  postFound.commentCount = postFound.comments.length || 0;
  return postFound;
};
