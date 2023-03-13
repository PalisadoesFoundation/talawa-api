import { withFilter } from "apollo-server-express";
import { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";

const CHAT_CHANNEL = "CHAT_CHANNEL";

export const directMessageChat: SubscriptionResolvers["directMessageChat"] = {
  // @ts-ignore
  subscribe: withFilter(
    (_parent, _args, context) => context.pubsub.asyncIterator(CHAT_CHANNEL),

    (payload) => payload?.directMessageChat
  ),
};
