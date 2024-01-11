import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
import { TRANSACTION_LOG_TYPES } from "../../constants";
/**
 * This function enables to update language.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * @returns Updated language.
 */
export const updateLanguage: MutationResolvers["updateLanguage"] = async (
  _parent,
  args,
  context
) => {
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: context.userId,
    },
    {
      $set: {
        appLanguageCode: args.languageCode,
      },
    },
    {
      new: true,
    }
  ).lean();
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "User",
    `User:${updatedUser?._id} updated appLanguageCode`
  );
  return updatedUser!;
};
