import { MembershipRequest } from '../../models';
import { OrganizationResolvers } from '../../../generated/graphQLTypescriptTypes';

export const membershipRequests: OrganizationResolvers['membershipRequests'] =
  async (parent) => {
    return await MembershipRequest.find({
      _id: {
        $in: parent.membershipRequests,
      },
    }).lean();
  };
