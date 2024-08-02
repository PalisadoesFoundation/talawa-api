import { MembershipRequest } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `membershipRequests` field of an `Organization`.
 *
 * This function retrieves the membership requests related to a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the IDs of the membership requests.
 * @returns A promise that resolves to an array of membership request documents found in the database. These documents represent the membership requests related to the organization.
 *
 * @see MembershipRequest - The MembershipRequest model used to interact with the membership requests collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
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
