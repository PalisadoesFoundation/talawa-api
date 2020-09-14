const MESSAGE_SENT_TO_DIRECT_CHAT = 'MESSAGE_SENT_TO_DIRECT_CHAT';

const Subscription = {
    messageSentToDirectChat: {
        subscribe: (parent, args, context, info) => context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]),
    }
}

module.exports = Subscription;