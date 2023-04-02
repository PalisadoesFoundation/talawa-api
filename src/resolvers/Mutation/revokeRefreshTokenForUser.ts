import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
/**
 * This function creates a refresh token for user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns True is operation successful.
 */
export const revokeRefreshTokenForUser: MutationResolvers["revokeRefreshTokenForUser"] =
  async (_parent, args) => {
    await User.updateOne(
      {
        _id: args.input.userId,
      },
      {
        $inc: {
          tokenVersion: 1,
        },
      }
    );

    return true;
  };
