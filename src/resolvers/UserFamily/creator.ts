import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { UserFamilyResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";

/**
 * Resolver function for the `creator` field of a `UserFamily`.
 *
 * This function retrieves the user who created a specific user family.
 *
 * @param parent - The parent object representing the user family. It contains information about the user family, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the user family.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see UserFamilyResolvers - The type definition for the resolvers of the UserFamily fields.
 *
 */
export const creator: UserFamilyResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creator.toString(),
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
