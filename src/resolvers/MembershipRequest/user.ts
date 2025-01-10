import type { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * Resolver function for the `user` field of a `MembershipRequest`.
 *
 * This function retrieves the user who made a specific membership request.
 *
 * @param parent - The parent object representing the membership request. It contains information about the membership request, including the ID of the user who made it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who made the membership request.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see MembershipRequestResolvers - The type definition for the resolvers of the MembershipRequest fields.
 *
 */
export const user: MembershipRequestResolvers["user"] = async (parent) => {
  const result = await User.findOne({
    _id: parent.user,
  }).lean();

  if (result) {
    return result;
  } else {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
};
