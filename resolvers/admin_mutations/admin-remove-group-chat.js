const User = require('../../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Group = require('../../models/Group');

module.exports = async (parent, args, context) => {
  //find message
  let group = await Group.findOne({ _id: args.groupId });
  if (!group) {
    throw new NotFoundError(
      requestContext.translate('group.notFound'),
      'group.notFound',
      'group'
    );
  }

  //gets user in token - to be used later on
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  //remove message from organization
  // org.overwrite({
  //   ...org._doc,
  //   messages: org._doc.posts.filter((message) => message != args.messageId),
  // });
  // await org.save();

  // //remove post from user
  // user.overwrite({
  //   ...user._doc,
  //   messages: user._doc.posts.filter((message) => message != args.messageId),
  // });
  // await user.save();

  //delete post
  await Group.deleteOne({ _id: args.groupId });

  //return user
  return {
    ...group._doc,
  };
};
