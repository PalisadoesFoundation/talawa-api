import { DirectChatMessageResolvers } from '../../../generated/graphQLTypescriptTypes';
import { User } from '../../models';

export const sender: DirectChatMessageResolvers['sender'] = async (parent) => {
  return await User.findOne({
    _id: parent.sender,
  }).lean();
};
