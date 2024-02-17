import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors } from "../../libraries";
import { AppUserProfile, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This query fetch the current user language from the database.
 * @param _parent-
 * @param _args-
 * @param context - An object that contains `userId`.
 * @returns A string `appLanguageCode` that contains language code.
 * If the `appLanguageCode` field not found then it throws a `NotFoundError` error.
 */
export const myLanguage: QueryResolvers["myLanguage"] = async (
  _parent,
  _args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  })
    .select(["appLanguageCode"])
    .lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      USER_NOT_FOUND_ERROR.MESSAGE,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  return currentUserAppProfile.appLanguageCode;
};
