import { withFilter } from "apollo-server-express";
import { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";

const MESSAGE_SENT_TO_DIRECT_CHAT = "MESSAGE_SENT_TO_DIRECT_CHAT";

export const filterFunction = async function (
  payload: any,
  context: any
): Promise<boolean> {
  const { currentUserId } = context.context;
  return (
    currentUserId === payload.messageSentToDirectChat.receiver ||
    currentUserId === payload.messageSentToDirectChat.sender
  );
};

export const messageSentToDirectChat: SubscriptionResolvers["messageSentToDirectChat"] =
  {
    // @ts-ignore
    subscribe: withFilter(
      (_parent, _args, context) =>
        context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]),

      (payload, _variables, context) => filterFunction(payload, context)
    ),
  };
