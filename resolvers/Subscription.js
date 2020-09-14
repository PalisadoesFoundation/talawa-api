const MESSAGE_SENT_TO_DIRECT_CHAT = 'MESSAGE_SENT_TO_DIRECT_CHAT';

const Subscription = {
    messageSentToDirectChat: {
        //subscribe: (parent, args, context, info) => context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]),

        subscribe: withFilter(
            (parent, args, context, info) => {
              return context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]);
            },
            (payload, variables, context) => {
      
              //RETURN ALL THE MESSAGES THAT ARE BEING SENT TO THE CHAT
              //console.log(payload.newMessage.receiver._id == context.context.currentUserId)
              //return payload.messageSentToDirectChat.directChatMessageBelongsTo == context.context.currentUserId;
            }
          ),
    }
}

module.exports = Subscription;