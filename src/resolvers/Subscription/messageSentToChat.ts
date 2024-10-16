import { withFilter } from "graphql-subscriptions";
import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { Chat } from "../../models";

const MESSAGE_SENT_TO_CHAT = "MESSAGE_SENT_TO_CHAT";

export const filterFunction = async function (
  payload: { messageSentToChat: { chatMessageBelongsTo: string } },
  variables: { userId: string },
): Promise<boolean> {
  const currentUserId = variables.userId.toString();
  const chatId = payload.messageSentToChat.chatMessageBelongsTo;

  const chat = await Chat.findOne({
    _id: chatId,
  }).lean();

  if (chat) {
    const currentUserIsChatMember = chat.users.some((user) =>
      user.equals(currentUserId),
    );
    return currentUserIsChatMember;
  } else {
    return false;
  }
};
/**
 * This property included a `subscribe` method, which is used to
 * subscribe the `receiver` and `sender` to receive Chat updates.
 *
 * @remarks To control updates on a per-client basis, the function uses the `withFilter`
 * method imported from `apollo-server-express` module.
 * You can learn about `subscription` {@link https://www.apollographql.com/docs/apollo-server/data/subscriptions/ | here }.
 */
export const messageSentToChat: SubscriptionResolvers["messageSentToChat"] = {
  // @ts-expect-error-ts-ignore
  subscribe: withFilter(
    (_parent, _args, context) =>
      context.pubsub.asyncIterator([MESSAGE_SENT_TO_CHAT]),

    (payload, variables) => filterFunction(payload, variables),
  ),
};
