const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Post = require('../../models/Post');
const {
  NOT_FOUND_POST_CODE,
  NOT_FOUND_POST_MESSAGE,
  NOT_FOUND_POST_PARAM,
  NOT_FOUND_POST_TEST,
} = require('../../../constants');

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
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_POST_TEST
        : requestContext.translate(NOT_FOUND_POST_MESSAGE),
      NOT_FOUND_POST_CODE,
      NOT_FOUND_POST_PARAM
    );
  }
  postFound.likeCount = postFound.likedBy.length || 0;
  postFound.commentCount = postFound.comments.length || 0;
  return postFound;
};
