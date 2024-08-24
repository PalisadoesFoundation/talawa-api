import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { Chat } from "../../models";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch Chats by a specified id from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the user.
 * @returns An object `Chat`.
 * If the `Chat` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const chatById: QueryResolvers["chatById"] = async (_parent, args) => {
  const chat = await Chat.findById(args.id).lean();

  if (!chat) {
    throw new errors.NotFoundError(
      CHAT_NOT_FOUND_ERROR.DESC,
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
    );
  }

  return chat;
};
