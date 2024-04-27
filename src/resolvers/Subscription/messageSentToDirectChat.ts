import { withFilter } from "graphql-subscriptions";
import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";

const MESSAGE_SENT_TO_DIRECT_CHAT = "MESSAGE_SENT_TO_DIRECT_CHAT";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // @ts-expect-error-ts-ignore
    subscribe: withFilter(
      (_parent, _args, context) =>
        context.pubsub.asyncIterator([MESSAGE_SENT_TO_DIRECT_CHAT]),

      (payload, _variables, context) => filterFunction(payload, context),
    ),
  };
