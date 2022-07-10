const { User, MessageChat } = require('../../models');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');

module.exports = async (parent, args, context) => {
  const user = await User.findOne({
    _id: args.data.receiver,
  });

  const senderUser = await User.findOne({
    _id: context.userId,
  });

  const isLangSame = user.appLanguageCode === senderUser.appLanguageCode;

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
    languageBarrier: !isLangSame,
  });

  messageChat = await messageChat.save();

  context.pubsub.publish('CHAT_CHANNEL', {
    directMessageChat: {
      ...messageChat._doc,
    },
  });

  return messageChat._doc;
};
