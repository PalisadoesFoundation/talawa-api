import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { errors } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch the language code for the user from the database.
 * @param _parent-
 * @param args - An object that contains `userId`.
 * @returns The language code of the user.
 */
export const userLanguage: QueryResolvers["userLanguage"] = async (
  _parent,
  args
) => {
  const user = await User.findOne({
    _id: args.userId,
  })
    .select(["appLanguageCode"])
    .lean();

  if (!user) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  return user.appLanguageCode;
};
