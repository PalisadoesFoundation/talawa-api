import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";

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
      USER_NOT_FOUND,
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  return user.appLanguageCode;
};
