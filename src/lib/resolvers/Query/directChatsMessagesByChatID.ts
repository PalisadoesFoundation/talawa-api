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
