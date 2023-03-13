import { USER_NOT_FOUND_ERROR } from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";

export const updateLanguage: MutationResolvers["updateLanguage"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // checks if current user exists
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  return await User.findOneAndUpdate(
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
};
