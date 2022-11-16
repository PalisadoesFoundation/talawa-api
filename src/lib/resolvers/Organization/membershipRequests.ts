import { MembershipRequest } from "../../models";
import { OrganizationResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the list of Membership requests for the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of membership requests for the organization.
 */
export const membershipRequests: OrganizationResolvers["membershipRequests"] =
  async (parent) => {
    return await MembershipRequest.find({
      _id: {
        $in: parent.membershipRequests,
      },
    }).lean();
  };
