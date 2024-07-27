import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { GroupChat } from "../../models";
/**
 * This query will fetch all the Direct chats for the current user from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the user.
 * @returns An object `GroupChat` that contains all direct chats of the current user.
 * If the `directChats` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const groupChatsByUserId: QueryResolvers["groupChatsByUserId"] = async (
  _parent,
  args,
) => {
  const groupChats = await GroupChat.find({
    users: args.id,
  }).lean();

  if (groupChats.length === 0) {
    throw new errors.NotFoundError(
      "Group Chats not found",
      "groupChats.notFound",
      "groupChats",
    );
  }

  return groupChats;
};
