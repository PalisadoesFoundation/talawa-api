import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { errors } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";

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
