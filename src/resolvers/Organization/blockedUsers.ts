import { User } from "../../models";
import type { InterfaceUser } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { decryptEmail } from "../../utilities/encryption";

/**
 * Resolver function for the `blockedUsers` field of an `Organization`.
 *
 * This function retrieves the users who are blocked by a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the IDs of the users who are blocked.
 * @returns A promise that resolves to an array of user documents found in the database. These documents represent the users who are blocked by the organization.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const blockedUsers: OrganizationResolvers["blockedUsers"] = async (
  parent,
) => {
  const blockedUsers = await User.find({
    _id: {
      $in: parent.blockedUsers,
    },
  }).lean();

  const decryptedBlockedUsers = blockedUsers.map(
    (blockedUser: InterfaceUser) => {
      if (!blockedUser.email) {
        console.warn(`User ${blockedUser._id} has no email`);
        return blockedUser;
      }
      try {
        const { decrypted } = decryptEmail(blockedUser.email);
        return { ...blockedUser, email: decrypted };
      } catch (error) {
        console.error(`Failed to decrypt email`, error);
        return blockedUser;
      }
    },
  );

  return decryptedBlockedUsers;
};
