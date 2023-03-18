import { USER_NOT_FOUND_ERROR } from "../../constants";
import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { User } from "../../models";
/**
 * This query fetch the user from the database.
 * @param _parent
 * @param args - An object that contains `id` for the user.
 * @param context
 * @returns An object that contains user data. If the user is not found then it throws a `NotFoundError` error.
 */
export const user: QueryResolvers["user"] = async (_parent, args, context) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const user = await User.findOne({
    _id: args.id,
  })
    .populate("adminFor")
    .lean();

  // This Query field doesn't allow client to see organizations they are blocked by
  return {
    ...user!,
    image: user?.image ? `${context.apiRootUrl}${user!.image}` : null,
    organizationsBlockedBy: [],
  };
};
