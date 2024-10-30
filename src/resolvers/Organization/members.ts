import { User } from "../../models";
import type { InterfaceUser } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { decryptEmail } from "../../utilities/encryption";

/**
 * Resolver function for the `members` field of an `Organization`.
 *
 * This function retrieves the users who are members of a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the IDs of the users who are members of it.
 * @returns A promise that resolves to an array of user documents found in the database. These documents represent the users who are members of the organization.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const members: OrganizationResolvers["members"] = async (parent) => {
  const users = await User.find({
    _id: {
      $in: parent.members,
    },
  }).lean();

  const decryptedUsers = users.map((user: InterfaceUser) => {
    if (!user.email) {
      console.warn(`User ${user._id} has no email`);
      return user;
    }
    try {
      const { decrypted } = decryptEmail(user.email);
      return { ...user, email: decrypted };
    } catch (error) {
      console.error(`Failed to decrypt email`, error);
      return user;
    }
  });

  return decryptedUsers;
};
