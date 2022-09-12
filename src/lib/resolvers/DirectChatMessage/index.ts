import { DirectChatMessageResolvers } from '../../../generated/graphQLTypescriptTypes';
import { directChatMessageBelongsTo } from './directChatMessageBelongsTo';
import { receiver } from './receiver';
import { sender } from './sender';

export const DirectChatMessage: DirectChatMessageResolvers = {
  directChatMessageBelongsTo,
  receiver,
  sender,
};
