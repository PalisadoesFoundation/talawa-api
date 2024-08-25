import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Chat } from "../../models";
import type { SortOrder } from "mongoose";
/**
 * This query will fetch all the Chats for the current user from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the user.
 * @returns An object `directChats` that contains all direct chats of the current user.
 * If the `directChats` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const getGroupChatsByUserId: QueryResolvers["getGroupChatsByUserId"] = async (
  _parent,
  _args,
  context
) => {
  const sort = {
    updatedAt: -1,
  } as
    | string
    | { [key: string]: SortOrder | { $meta: unknown } }
    | [string, SortOrder][]
    | null
    | undefined;

  const chats = await Chat.find({
    users: context.userId,
    isGroup: true,
  })
    .sort(sort)
    .lean();

  return chats;
};