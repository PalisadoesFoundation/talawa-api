import { DirectChatMessageResolvers } from '../../../generated/graphQLTypescriptTypes';
import { User } from '../../models';

export const receiver: DirectChatMessageResolvers['receiver'] = async (
  parent
) => {
  return await User.findOne({
    _id: parent.receiver,
  }).lean();
};
