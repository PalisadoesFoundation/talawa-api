import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { Chat } from "../../models";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch all the Direct chats for the current user from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the user.
 * @returns An object `directChats` that contains all direct chats of the current user.
 * If the `directChats` object is null then it throws `NotFoundError` error.
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
