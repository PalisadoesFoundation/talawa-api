import { DirectChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { directChatMessageBelongsTo } from "./directChatMessageBelongsTo";
import { receiver } from "./receiver";
import { sender } from "./sender";

export const DirectChatMessage: DirectChatMessageResolvers = {
  directChatMessageBelongsTo,
  receiver,
  sender,
};
