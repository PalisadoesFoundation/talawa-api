import { withFilter } from "apollo-server-express";
import { SubscriptionResolvers } from "../../../generated/graphqlCodegen";

const MESSAGE_SENT_TO_DIRECT_CHAT = "MESSAGE_SENT_TO_DIRECT_CHAT";

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

      (payload, _variables, context) => {
        const { currentUserId } = context.context;

        return (
          currentUserId === payload.messageSentToDirectChat.receiver ||
          currentUserId === payload.messageSentToDirectChat.sender
        );
      }
    ),
  };
