import { withFilter } from "apollo-server-express";
import { SubscriptionResolvers } from "../../../generated/graphqlCodegen";
import { GroupChat } from "../../models";

const MESSAGE_SENT_TO_GROUP_CHAT = "MESSAGE_SENT_TO_GROUP_CHAT";

/**
 * This property included a `subscribe` method, which is used to 
 * subscribe the `current_user` to get updates for Group chats.
 * 
 * @remarks To control updates on a per-client basis, the function uses the `withFilter` 
 * method imported from `apollo-server-express` module. 
 * You can learn about `subscription` {@link https://www.apollographql.com/docs/apollo-server/data/subscriptions/ | here }.
 */
export const messageSentToGroupChat: SubscriptionResolvers["messageSentToGroupChat"] =
  {
    // @ts-ignore
    subscribe: withFilter(
      (_parent, _args, context) =>
        context.pubsub.asyncIterator([MESSAGE_SENT_TO_GROUP_CHAT]),

      async (payload, _variables, context) => {
        const { currentUserId } = context.context;

        const groupChatId =
          payload.messageSentToGroupChat.groupChatMessageBelongsTo;

        const groupChat = await GroupChat.findOne({
          _id: groupChatId,
        }).lean();

        const currentUserIsGroupChatMember = groupChat!.users.some(
          (user) => user.toString() === currentUserId.toString()
        );

        return currentUserIsGroupChatMember;
      }
    ),
  };
