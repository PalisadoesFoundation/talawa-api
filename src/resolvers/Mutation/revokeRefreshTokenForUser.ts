import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
import { TRANSACTION_LOG_TYPES } from "../../constants";
/**
 * This function creates a refresh token for user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns True is operation successful.
 */
export const revokeRefreshTokenForUser: MutationResolvers["revokeRefreshTokenForUser"] =
  async (_parent, args, context) => {
    await User.updateOne(
      {
        _id: context.userId,
      },
      {
        $unset: { token: 1 },
      }
    );
    storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "User",
      `User:${context.userId} updated token`
    );

    return true;
  };
