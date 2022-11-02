import { GroupChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { groupChatMessageBelongsTo } from "./groupChatMessageBelongsTo";
import { sender } from "./sender";

export const GroupChatMessage: GroupChatMessageResolvers = {
  groupChatMessageBelongsTo,
  sender,
};
