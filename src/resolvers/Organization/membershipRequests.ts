import { MembershipRequest } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the list of Membership requests for the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - An object that contains relevant data to perform the query.
 * @returns An object that contains the list of membership requests for the organization.
 */
export const membershipRequests: OrganizationResolvers["membershipRequests"] =
  async (parent, args) => {
    const membershipRequests = await MembershipRequest.find({
      _id: {
        $in: parent.membershipRequests,
      },
    })
      .populate("user")
      .limit(args.first ?? 0)
      .skip(args.skip ?? 0)
      .lean();

    const filteredMembershipRequests = membershipRequests.filter(
      (membershipRequest) => {
        const user = membershipRequest.user;

        return (
          user &&
          user.firstName
            .toLowerCase()
            .startsWith(
              args.where?.user?.firstName_contains?.toLowerCase() || "",
            )
        );
      },
    );

    return filteredMembershipRequests;
  };
