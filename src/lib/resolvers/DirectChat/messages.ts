import { DirectChatMessage } from '../../models';
import { DirectChatResolvers } from '../../../generated/graphQLTypescriptTypes';

export const messages: DirectChatResolvers['messages'] = async (parent) => {
  return await DirectChatMessage.find({
    _id: {
      $in: parent.messages,
    },
  }).lean();
};
