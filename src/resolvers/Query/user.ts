import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This query fetch the user from the database.
 *
 * This function ensure that users can only query their own data and not access details of other users , protecting sensitive data.
 *
 * @param _parent-
 * @param args - An object that contains `id` for the user.
 * @param context-
 * @returns An object that contains user data. If the user is not found then it throws a `NotFoundError` error.
 */
export const user: QueryResolvers["user"] = async (_parent, args, context) => {
  // Check if the current user exists in the system
  const currentUserExists = !!(await User.exists({
    _id: context.userId,
  }));

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      USER_NOT_FOUND_ERROR.DESC,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the requesting user is trying to access their own data
  if (context.userId !== args.id) {
    throw new errors.UnauthorizedError(
      "Access denied. You can only view your own profile.",
    );
  }

  //Fetch the user data from the database based on the provided ID (args.id)
  const user: InterfaceUser = (await User.findById(
    args.id,
  ).lean()) as InterfaceUser;

  const userAppProfile: InterfaceAppUserProfile = (await AppUserProfile.findOne(
    {
      userId: user._id,
    },
  )
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .populate("pledges")
    .populate("campaigns")
    .lean()) as InterfaceAppUserProfile;

  // This Query field doesn't allow client to see organizations they are blocked by
  return {
    user: {
      ...user,
      image: user?.image ? `${context.apiRootUrl}${user.image}` : null,
      organizationsBlockedBy: [],
    },
    appUserProfile: userAppProfile,
  };
};
