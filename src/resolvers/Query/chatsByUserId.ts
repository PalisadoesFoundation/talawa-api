import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Chat } from "../../models";
import type { SortOrder } from "mongoose";
/**
 * This query will fetch all the Chats for the current user from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the user.
 * @returns An object `chats` that contains all chats of the current user.
 * If the `Chats` object is null then returns an empty array.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const chatsByUserId: QueryResolvers["chatsByUserId"] = async (
  _parent,
  args,
  context,
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
    users: args.id,
  })
    .sort(sort)
    .lean();

  const chatList = chats.map((chat) => {
    if (chat.isGroup && chat.image) {
      return { ...chat, image: `${context.apiRootUrl}${chat.image}` };
    }
    return chat;
  });
  return chatList;
};
