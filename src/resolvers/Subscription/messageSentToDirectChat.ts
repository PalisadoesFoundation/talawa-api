import { withFilter } from "apollo-server-express";
import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";

const MESSAGE_SENT_TO_DIRECT_CHAT = "MESSAGE_SENT_TO_DIRECT_CHAT";

export const filterFunction = function (payload: any, context: any): boolean {
  const { currentUserId } = context.context;
  return (
    currentUserId === payload.messageSentToDirectChat.receiver ||
    currentUserId === payload.messageSentToDirectChat.sender
  );
};
/**
 * This property included a `subscribe` method, which is used to
 * subscribe the `receiver` and `sender` to receive Direct Chat updates.
 *
 * @remarks To control updates on a per-client basis, the function uses the `withFilter`
 * method imported from `apollo-server-express` module.
 * You can learn about `subscription` {@link https://www.apollographql.com/docs/apollo-server/data/subscriptions/ | here }.
 */
export const messageSentToDirectChat: SubscriptionResolvers["messageSentToDirectChat"] =
  {
    // @ts-ignore
    subscribe: withFilter(
      (_parent, _args, context) =>
        context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]),

      (payload, _variables, context) => filterFunction(payload, context)
    ),
  };
