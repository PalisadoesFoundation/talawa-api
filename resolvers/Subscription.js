
const { withFilter } = require("apollo-server-express");


const MESSAGE_SENT_TO_DIRECT_CHAT = 'MESSAGE_SENT_TO_DIRECT_CHAT';
const MESSAGE_SENT_TO_GROUP_CHAT = "MESSAGE_SENT_TO_GROUP_CHAT";
const GroupChat = require("../models/GroupChat");

const Subscription = {
    messageSentToDirectChat: {
        //subscribe: (parent, args, context, info) => context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]),

        subscribe: withFilter(
            (parent, args, context, info) => {
              return context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]);
            },
            (payload, variables, context) => {
              const currentUserId = context.context.currentUserId;
              return currentUserId == payload.messageSentToDirectChat.receiver || currentUserId == payload.messageSentToDirectChat.sender;
            
            }
          ),
    },
    messageSentToGroupChat: {

      // Show All messages sent to group chats the user belongs to but he didnt send ie the current user did not send the message

      subscribe: withFilter(
        (parent, args, context, info) => {
          return context.pubsub.asyncIterator([MESSAGE_SENT_TO_GROUP_CHAT]);
        },
        async (payload, variables, context) => {
          const currentUserId = context.context.currentUserId;
          const sender = payload.messageSentToGroupChat.sender;
          const groupChatId = payload.messageSentToGroupChat.groupChatMessageBelongsTo;

          const groupChat = await GroupChat.findById(groupChatId);

          //console.log(sender)
          
          //const userIsNotSender = currentUserId != sender

          const userIsInGroupChat = groupChat.users.includes(currentUserId);
          //console.log(groupChat.users.includes(currentUserId));

          return userIsInGroupChat;
        
        }
      ),

    }
}

module.exports = Subscription;