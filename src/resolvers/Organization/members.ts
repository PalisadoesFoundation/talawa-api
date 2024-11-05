import { GraphQLError } from "graphql";
import { logger } from "../../libraries";
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
      logger.warn("User missing email field", { userId: user._id });
      return user;
    }
    try {
      const { decrypted } = decryptEmail(user.email);
      if (!decrypted) {
        throw new Error("Decryption resulted in null or empty email");
      }
      return { ...user, email: decrypted };
    } catch (error) {
      logger.error("Email decryption failed", {
        userId: user._id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Consider throwing an error instead of silently continuing
      throw new GraphQLError("Failed to process user data");
    }
  });

  return decryptedUsers;
};
