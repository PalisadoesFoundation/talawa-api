import { User } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { decryptEmail } from "../../utilities/encryptionModule";

/**
 * This resolver function will fetch and return the list of members of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all members of the organization.
 */
export const members: OrganizationResolvers["members"] = async (parent) => {
  const users = await User.find({
    _id: {
      $in: parent.members,
    },
  }).lean();

  // Decrypting email parameter for each user object
  // eslint-disable-next-line
  const decryptedUsers = users.map((user: any) => {
    const { decrypted } = decryptEmail(user.email);
    return { ...user, email: decrypted }; // Returning user object with decrypted email
  });

  return decryptedUsers;
};
