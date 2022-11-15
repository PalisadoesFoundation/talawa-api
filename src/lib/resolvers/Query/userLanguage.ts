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
 * This query will fetch the language code for the user from the database.
 * @param _parent 
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
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return user.appLanguageCode;
};
