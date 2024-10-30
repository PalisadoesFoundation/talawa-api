import type { PostResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { decryptEmail } from "../../utilities/encryption";

/**
 * Resolver function for the `creator` field of a `Post`.
 *
 * This function retrieves the user who created a specific post.
 *
 * @param parent - The parent object representing the post. It contains information about the post, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the post.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see PostResolvers - The type definition for the resolvers of the Post fields.
 *
 */
export const creator: PostResolvers["creator"] = async (parent) => {
  const creator = await User.findOne({
    _id: parent.creatorId,
  }).lean();

    if (creator?.email) {
        try {
          const decryptionResult = decryptEmail(creator.email);
          if (!decryptionResult?.decrypted) {
            console.error('Invalid decryption result');
            throw new Error('Failed to decrypt email');
          }
          creator.email = decryptionResult.decrypted;
        } catch (error) {
        console.error('Failed to decrypt email:', error);
          throw new Error('Failed to process creator email');
        }
      }

  return creator;
};