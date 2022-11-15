import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";

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
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return currentUser.appLanguageCode;
};
