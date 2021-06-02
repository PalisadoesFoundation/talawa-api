const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const removeComment = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const comment = await Comment.findOne({ _id: args.id });
  if (!comment) {
    throw new NotFoundError(
      requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }

  if (!(comment.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  await Post.updateOne(
    { _id: comment.post },
    {
      $pull: {
        comments: args.id,
      },
    }
  );

  await Comment.deleteOne({ _id: args.id });
  return comment;
};

module.exports = removeComment;
