const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const removeComment = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const comment = await Comment.findOne({ _id: args.id });
  if (!comment) {
    throw new NotFound([
      {
        message: requestContext.translate('comment.notFound'),
        code: 'comment.notFound',
        param: 'comment',
      },
    ]);
  }

  if (!(comment.creator !== context.userId)) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
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
