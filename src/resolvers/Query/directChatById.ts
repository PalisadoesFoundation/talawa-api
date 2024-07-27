import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { DirectChat } from "../../models";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";

/**
 * This query will fetch all messages for a certain direct chat for the user from database.
 * @param _parent-
 * @param args - An object that contains `id` of the direct chat.
 * @returns A `directChatsMessages` object that holds all of the messages from the specified direct chat.
 * If the `directChatsMessages` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */

export const directChatById: QueryResolvers["directChatById"] = async (
  _parent,
  args,
) => {
  const directChat = await DirectChat.findById(args.id).lean();

  if (!directChat) {
    throw new errors.NotFoundError(
      CHAT_NOT_FOUND_ERROR.DESC,
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
    );
  }

  return directChat;
};
