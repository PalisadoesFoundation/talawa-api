import { GroupChatResolvers } from '../../../generated/graphQLTypescriptTypes';
import { User } from '../../models';

export const creator: GroupChatResolvers['creator'] = async (parent) => {
  return await User.findOne({
    _id: parent.creator,
  }).lean();
};
