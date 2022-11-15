import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { DirectChatMessage } from "../../models";
import {
  IN_PRODUCTION,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,
} from "../../../constants";

/**
 * This query will fetch all messages for a certain direct chat for the user from database.
 * @param _parent 
 * @param args - An object that contains `id` of the direct chat.
 * @returns A `directChatsMessages` object that holds all of the messages from the specified direct chat.
 * If the `directChatsMessages` object is null then it throws `NotFoundError` error. 
 * @remarks You can learn about GraphQL `Resolvers` 
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const directChatsMessagesByChatID: QueryResolvers["directChatsMessagesByChatID"] =
  async (_parent, args) => {
    const directChatsMessages = await DirectChatMessage.find({
      directChatMessageBelongsTo: args.id,
    }).lean();

    if (directChatsMessages.length === 0) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? CHAT_NOT_FOUND
          : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
        CHAT_NOT_FOUND_CODE,
        CHAT_NOT_FOUND_PARAM
      );
    }

    return directChatsMessages;
  };
