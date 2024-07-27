import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";

/**
 * Resolver function for the `creator` field of an `Organization`.
 *
 * This function retrieves the user who created a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the organization.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const creator: OrganizationResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creatorId,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  return user;
};
