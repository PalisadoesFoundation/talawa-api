import type { GroupChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { groupChatMessageBelongsTo } from "./groupChatMessageBelongsTo";
import { sender } from "./sender";

export const GroupChatMessage: GroupChatMessageResolvers = {
  groupChatMessageBelongsTo,
  sender,
};
