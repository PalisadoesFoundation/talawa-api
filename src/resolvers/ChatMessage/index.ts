import type { ChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { chatMessageBelongsTo } from "./chatMessageBelongsTo";
import { replyTo } from "./replyTo";
import { sender } from "./sender";

export const ChatMessage: ChatMessageResolvers = {
  chatMessageBelongsTo,
  sender,
  replyTo,
};
