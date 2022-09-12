import { DirectChatMessageResolvers } from '../../../generated/graphQLTypescriptTypes';
import { DirectChat } from '../../models';

export const directChatMessageBelongsTo: DirectChatMessageResolvers['directChatMessageBelongsTo'] =
  async (parent) => {
    return await DirectChat.findOne({
      _id: parent.directChatMessageBelongsTo,
    }).lean();
  };
