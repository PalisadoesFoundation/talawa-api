import { MembershipRequest } from "../../models";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const membershipRequests: OrganizationResolvers["membershipRequests"] =
  async (parent) => {
    return await MembershipRequest.find({
      _id: {
        $in: parent.membershipRequests,
      },
    }).lean();
  };
