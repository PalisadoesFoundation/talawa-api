import type { DirectChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { directChatMessageBelongsTo } from "./directChatMessageBelongsTo";
import { receiver } from "./receiver";
import { sender } from "./sender";

export const DirectChatMessage: DirectChatMessageResolvers = {
  directChatMessageBelongsTo,
  receiver,
  sender,
};
