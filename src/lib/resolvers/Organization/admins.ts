import { User } from '../../models';
import { OrganizationResolvers } from '../../../generated/graphQLTypescriptTypes';

export const admins: OrganizationResolvers['admins'] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.admins,
    },
  }).lean();
};
