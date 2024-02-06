import type { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { decryptEmail } from "../../utilities/encryptionModule";
import { errors } from "../../libraries";
/**
 * This resolver function will retrieve and return the user who sent the membership request from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the User data.
 */
export const user: MembershipRequestResolvers["user"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.user,
  }).lean();
  if (!user) {
    throw new errors.NotFoundError("User not found");
  }
  const { decrypted } = decryptEmail(user.email);
  user.email = decrypted;
  return user;
};
