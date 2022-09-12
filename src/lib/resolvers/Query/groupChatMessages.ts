import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { GroupChatMessage } from '../../models';

export const groupChatMessages: QueryResolvers['groupChatMessages'] =
  async () => {
    return await GroupChatMessage.find().lean();
  };
