import { Organization } from '../../models';
import { DirectChatResolvers } from '../../../generated/graphQLTypescriptTypes';

export const organization: DirectChatResolvers['organization'] = async (
  parent
) => {
  return await Organization.findOne({
    _id: parent.organization,
  }).lean();
};
