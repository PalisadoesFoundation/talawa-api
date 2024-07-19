/* eslint-disable @typescript-eslint/no-explicit-any */
import { withFilter } from "graphql-subscriptions";
import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { GroupChat } from "../../models";

const MESSAGE_SENT_TO_GROUP_CHAT = "MESSAGE_SENT_TO_GROUP_CHAT";

/**
 * This function is used to filter the subscription payload based on the current user's membership in the group chat.
 *
 * @param payload - The payload of the subscription message.
 * @param context - The context object containing the current user's ID.
 * @returns A promise that resolves to a boolean value indicating whether the current user is a member of the group chat.
 */
export const filterFunction = async function (
  payload: any,
  context: any,
): Promise<boolean> {
  const { currentUserId } = context.context;
  const groupChatId = payload.messageSentToGroupChat.groupChatMessageBelongsTo;

  const groupChat = await GroupChat.findOne({
    _id: groupChatId,
  }).lean();

  if (groupChat) {
    const currentUserIsGroupChatMember = groupChat.users.some((user) =>
      user.equals(currentUserId),
    );
    return currentUserIsGroupChatMember;
  } else {
    return false;
  }
};
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
    // @ts-expect-error-ts-ignore
    subscribe: withFilter(
      (_parent, _args, context) =>
        context.pubsub.asyncIterator([MESSAGE_SENT_TO_GROUP_CHAT]),

      (payload, _variables, context) => filterFunction(payload, context),
    ),
  };
