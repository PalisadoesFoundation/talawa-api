import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { DirectChat } from '../../models';

export const directChats: QueryResolvers['directChats'] = async () => {
  return await DirectChat.find().lean();
};
