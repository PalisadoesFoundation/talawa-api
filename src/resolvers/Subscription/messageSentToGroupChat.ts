import { withFilter } from "apollo-server-express";
import { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { GroupChat } from "../../models";

const MESSAGE_SENT_TO_GROUP_CHAT = "MESSAGE_SENT_TO_GROUP_CHAT";

export const filterFunction = async function (
  payload: any,
  context: any
): Promise<boolean> {
  const { currentUserId } = context.context;
  const groupChatId = payload.messageSentToGroupChat.groupChatMessageBelongsTo;

  const groupChat = await GroupChat.findOne({
    _id: groupChatId,
  }).lean();

  const currentUserIsGroupChatMember = groupChat!.users.some(
    (user) => user.toString() === currentUserId.toString()
  );
  return currentUserIsGroupChatMember;
};

export const messageSentToGroupChat: SubscriptionResolvers["messageSentToGroupChat"] =
  {
    // @ts-ignore
    subscribe: withFilter(
      (_parent, _args, context) =>
        context?.pubsub?.asyncIterator([MESSAGE_SENT_TO_GROUP_CHAT]),
      async (payload, _variables, context) => filterFunction(payload, context)
    ),
  };
