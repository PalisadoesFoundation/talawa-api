import { User } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { decryptEmail } from "../../utilities/encryptionModule";
/**
 * This resolver function will fetch and return the blocked users for the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of blocked users for the organization.
 */
export const blockedUsers: OrganizationResolvers["blockedUsers"] = async (
  parent,
) => {
  const blockedUsers = await User.find({
    _id: {
      $in: parent.blockedUsers,
    },
  }).lean();

  // Decrypting email parameter for each blocked user object
  // eslint-disable-next-line
  const decryptedBlockedUsers = blockedUsers.map((blockedUser: any) => {
    const { decrypted } = decryptEmail(blockedUser.email);
    return { ...blockedUser, email: decrypted }; // Returning blocked user object with decrypted email
  });
  console.log(decryptedBlockedUsers);
  return decryptedBlockedUsers;
};
