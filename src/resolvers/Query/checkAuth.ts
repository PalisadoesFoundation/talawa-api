import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { AppUserProfile, User } from "../../models";
import { errors } from "../../libraries";
/**
 * This query determines whether or not the user exists in the database (MongoDB).
 * @param _parent - The return value of the resolver for this field's parent
 * @param _args - An object that contains all GraphQL arguments provided for this field.
 * @param context - An object that contains `userId`.
 * @returns An `object` that contains user data.
 * @remarks You can learn about GraphQL `Resolvers` {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const checkAuth: QueryResolvers["checkAuth"] = async (
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
  }).lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  return currentUser;
};
