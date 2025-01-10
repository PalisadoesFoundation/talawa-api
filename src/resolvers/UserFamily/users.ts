import type { UserFamilyResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `users` field of a `UserFamily`.
 *
 * This function retrieves the users who are part of a specific user family.
 *
 * @param parent - The parent object representing the user family. It contains information about the user family, including the IDs of the users who are part of it.
 * @returns A promise that resolves to an array of user documents found in the database. These documents represent the users who are part of the user family.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see UserFamilyResolvers - The type definition for the resolvers of the UserFamily fields.
 *
 */
export const users: UserFamilyResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
