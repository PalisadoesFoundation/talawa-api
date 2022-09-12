import { GroupChatMessageResolvers } from '../../../generated/graphQLTypescriptTypes';
import { GroupChat } from '../../models';

export const groupChatMessageBelongsTo: GroupChatMessageResolvers['groupChatMessageBelongsTo'] =
  async (parent) => {
    return await GroupChat.findOne({
      _id: parent.groupChatMessageBelongsTo,
    }).lean();
  };
