import { User } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { decryptEmail } from "../../utilities/encryptionModule";
/**
 * This resolver function will fetch and return the admins of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all admins of the organization.
 */
export const admins: OrganizationResolvers["admins"] = async (parent) => {
  try {
    const admins = await User.find({
      _id: {
        $in: parent.admins,
      },
    }).lean();

    // Decrypting email parameter for each admin object
    // eslint-disable-next-line
    const decryptedAdmins = admins.map((admin: any) => {
      const { decrypted } = decryptEmail(admin.email);
      return { ...admin, email: decrypted }; // Returning admin object with decrypted email
    });

    return decryptedAdmins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
};
