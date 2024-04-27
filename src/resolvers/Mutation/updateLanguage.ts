import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import type { InterfaceUser } from "../../models";
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
  context,
) => {
  return (await User.findOneAndUpdate(
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
    },
  ).lean()) as InterfaceUser;
};
