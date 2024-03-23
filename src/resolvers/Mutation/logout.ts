import { AppUserProfile } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables logout.
 * @param _parent - parent of current request
 * @param _args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * @returns True if the operation is successful.
 */
export const logout: MutationResolvers["logout"] = async (
  _parent,
  _args,
  context,
) => {
  // Sets token field of currentUser with _id === context.userId to null.
  await AppUserProfile.updateOne(
    {
      userId: context.userId,
    },
    {
      $set: {
        token: null,
      },
    },
  );

  // Returns true if the operation is successful.
  return true;
};
