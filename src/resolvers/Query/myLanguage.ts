import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { errors } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query fetch the current user language from the database.
 * @param _parent
 * @param _args
 * @param context - An object that contains `userId`.
 * @returns A string `appLanguageCode` that contains language code.
 * If the `appLanguageCode` field not found then it throws a `NotFoundError` error.
 */
export const myLanguage: QueryResolvers["myLanguage"] = async (
  _parent,
  _args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  })
    .select(["appLanguageCode"])
    .lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  return currentUser.appLanguageCode;
};
