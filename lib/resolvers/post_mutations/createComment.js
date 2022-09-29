const User = require('../../models/User');
const { addTenantId, tenantCtx } = require('../../helper_functions/');
// const Comment = require('../../models/Comment');
// const Post = require('../../models/Post');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const { db, id: postId, tenantId } = await tenantCtx(args.postId);
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
  const { Post, Comment } = db;

  let newComment = new Comment({
    ...args.data,
    creator: context.userId,
    post: postId,
  });

  await Post.updateOne(
    { _id: postId },
    {
      $push: {
        comments: newComment,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );

  newComment = await newComment.save();

  return {
    ...newComment._doc,
    _id: addTenantId(newComment._id, tenantId),
    post: addTenantId(newComment.post, tenantId),
  };
};
