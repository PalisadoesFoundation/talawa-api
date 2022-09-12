import { User } from '../../models';
import { DirectChatResolvers } from '../../../generated/graphQLTypescriptTypes';

export const creator: DirectChatResolvers['creator'] = async (parent) => {
  return await User.findOne({
    _id: parent.creator,
  }).lean();
};
