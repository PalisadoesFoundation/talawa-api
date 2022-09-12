import { GroupChatMessageResolvers } from '../../../generated/graphQLTypescriptTypes';
import { groupChatMessageBelongsTo } from './groupChatMessageBelongsTo';
import { sender } from './sender';

export const GroupChatMessage: GroupChatMessageResolvers = {
  groupChatMessageBelongsTo,
  sender,
};
