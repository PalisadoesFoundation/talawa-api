import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { Group } from '../../models';

export const groups: QueryResolvers['groups'] = async () => {
  return await Group.find().lean();
};
