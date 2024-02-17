import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This query will fetch the language code for the user from the database.
 * @param _parent-
 * @param args - An object that contains `userId`.
 * @returns The language code of the user.
 */
export const userLanguage: QueryResolvers["userLanguage"] = async (
  _parent,
  args,
) => {
  const user = await User.findOne({
    _id: args.userId,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const appUserProfile = await AppUserProfile.findOne({
    userId: user._id,
  })
    .select(["appLanguageCode"])
    .lean();
  if (!appUserProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  return appUserProfile.appLanguageCode;
};
