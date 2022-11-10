import { withFilter } from "apollo-server-express";
import { SubscriptionResolvers } from "../../../generated/graphqlCodegen";
import { GroupChat } from "../../models";

const MESSAGE_SENT_TO_GROUP_CHAT = "MESSAGE_SENT_TO_GROUP_CHAT";

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
