import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
/**
 * This function enables to save Fcm Token.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * @returns True if operation is successful.
 */
export const saveFcmToken: MutationResolvers["saveFcmToken"] = async (
  _parent,
  args,
  context
) => {
  await User.updateOne(
    {
      _id: context.userId,
    },
    {
      $set: {
        token: args.token,
      },
    }
  );

  return true;
};
