import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { GroupChat } from '../../models';

export const groupChats: QueryResolvers['groupChats'] = async () => {
  return await GroupChat.find().lean();
};
