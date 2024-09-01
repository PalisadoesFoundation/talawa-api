import type { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * Resolver function for the `organization` field of a `MembershipRequest`.
 *
 * This function retrieves the organization associated with a specific membership request.
 *
 * @param parent - The parent object representing the membership request. It contains information about the membership request, including the ID of the organization it is associated with.
 * @returns A promise that resolves to the organization document found in the database. This document represents the organization associated with the membership request.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see MembershipRequestResolvers - The type definition for the resolvers of the MembershipRequest fields.
 *
 */
export const organization: MembershipRequestResolvers["organization"] = async (
  parent,
) => {
  const result = await Organization.findOne({
    _id: parent.organization,
  }).lean();

  if (result) {
    return result;
  } else {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }
};
