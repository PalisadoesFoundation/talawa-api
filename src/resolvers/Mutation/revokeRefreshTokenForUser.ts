import { AppUserProfile } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function creates a refresh token for user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns True is operation successful.
 */
export const revokeRefreshTokenForUser: MutationResolvers["revokeRefreshTokenForUser"] =
  async (_parent, args, context) => {
    await AppUserProfile.updateOne(
      {
        userId: context.userId,
      },
      {
        $unset: { token: 1 },
      },
    );

    return true;
  };
