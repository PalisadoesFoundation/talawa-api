import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { decryptEmail } from "../../utilities/encryptionModule";

export const creator: PostResolvers["creator"] = async (parent) => {
  const creator = await User.findOne({
    _id: parent.creatorId,
  }).lean();

  if (creator && creator.email) {
    creator.email = decryptEmail(creator.email).decrypted; // Decrypt the email
  }

  return creator;
};
