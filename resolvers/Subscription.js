
const { withFilter } = require("apollo-server-express");


const MESSAGE_SENT_TO_DIRECT_CHAT = 'MESSAGE_SENT_TO_DIRECT_CHAT';

const Subscription = {
    messageSentToDirectChat: {
        //subscribe: (parent, args, context, info) => context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]),

        subscribe: withFilter(
            (parent, args, context, info) => {
              return context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]);
            },
            (payload, variables, context) => {
              const currentUserId = context.context.currentUserId;
              const receiverOfMessageSentToADirectChat = payload.messageSentToDirectChat.receiver;
              // Return the message if it was sent to the current user
              return currentUserId == receiverOfMessageSentToADirectChat
            
            }
          ),
    }
}

module.exports = Subscription;