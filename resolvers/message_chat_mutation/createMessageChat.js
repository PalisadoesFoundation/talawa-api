const User = require('../../models/User');
const MessageChat = require('../../models/Chat');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const user = await User.findOne({
    _id: args.data.receiver,
  });

  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  let messageChat = new MessageChat({
    sender: context.userId,
    receiver: user.id,
    message: args.data.message,
  });

  messageChat = await messageChat.save();

  return messageChat._doc;
};
