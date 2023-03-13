import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";

export const saveFcmToken: MutationResolvers["saveFcmToken"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  await User.updateOne(
    {
      _id: context.userId,
    },
    {
      $set: {
        token: args.token,
      },
    }
  );

  return true;
};
