const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Comment = require('../../models/Comment');
const Organization = require('../../models/Organization')

module.exports = async (parent, args) => {
  const commentFound = await Comment.find({ post: args.id })
    .populate('creator', '-password')
    .populate('post')
    .populate('likedBy');
  //comment does not exist
  if (!commentFound.length) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
       ? 'Comment not found'
       : requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }
  //user does not exist
  if (!commentFound[0].creator) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
       ? 'User not found'
       : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
  //post does not exist
  if (!commentFound[0].post) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
       ? 'Post not found'
       : requestContext.translate('post.notFound'),
      'post.notFound',
      'post'
    );
  }
  //organization does not exist
  const org = await Organization.find({_id: commentFound[0].post.organization})
  if (!org.length) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Organization not found'
        : requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }
  return commentFound;
};
