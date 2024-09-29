import { withFilter } from "graphql-subscriptions";
import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";

const CHAT_CHANNEL = "CHAT_CHANNEL";
/**
 * This property contained a `subscribe` field, which is used to subscribe
 * the user to get updates for the `CHAT_CHANNEL` event.
 * @remarks To control updates on a per-client basis, the function uses the `withFilter`
 * method imported from `apollo-server-express` module.
 * You can learn about `subscription` {@link https://www.apollographql.com/docs/apollo-server/data/subscriptions/ | here }.
 */
export const directMessageChat: SubscriptionResolvers["directMessageChat"] = {
  // @ts-expect-error-ts-ignore
  subscribe: withFilter(
    (_parent, _args, context) => context.pubsub.asyncIterator(CHAT_CHANNEL),

    (payload) => payload?.directMessageChat,
  ),
};
