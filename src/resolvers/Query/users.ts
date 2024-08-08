import { UNAUTHENTICATED_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

/**
 * This query will fetch all the users in specified order from the database.
 * @param _parent-
 * @param args - An object that contains relevant data to perform the query.
 * @param context-
 * @returns An object that contains the list of all the users.
 * @remarks The query function uses `getSort()` function to sort the data in specified.
 */
export const users: QueryResolvers["users"] = async (
  _parent,
  args,
  context,
) => {
  const where = getWhere<InterfaceUser>(args.where);
  const sort = getSort(args.orderBy);

  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (!currentUser) {
    throw new errors.UnauthenticatedError(
      requestContext.translate(UNAUTHENTICATED_ERROR.MESSAGE),
      UNAUTHENTICATED_ERROR.CODE,
      UNAUTHENTICATED_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthenticatedError(
      requestContext.translate(UNAUTHENTICATED_ERROR.MESSAGE),
      UNAUTHENTICATED_ERROR.CODE,
      UNAUTHENTICATED_ERROR.PARAM,
    );
  }

  const filterCriteria = {
    ...where,
  };

  const users = await User.find(filterCriteria)
    .sort(sort)
    .limit(args.first ?? 0)
    .skip(args.skip ?? 0)
    .select(["-password"])
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("organizationsBlockedBy")
    .lean();

  return await Promise.all(
    users.map(async (user) => {
      const isSuperAdmin = currentUserAppProfile.isSuperAdmin;
      const appUserProfile = await AppUserProfile.findOne({ userId: user._id })
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .populate("pledges")
        .populate("campaigns");

      return {
        user: {
          ...user,
          image: user.image ? `${context.apiRootUrl}${user.image}` : null,
          organizationsBlockedBy:
            isSuperAdmin && currentUser._id !== user._id
              ? user.organizationsBlockedBy
              : [],
        },
        appUserProfile: (appUserProfile as InterfaceAppUserProfile) || {
          _id: "",
          adminFor: [],
          isSuperAdmin: false,
          createdOrganizations: [],
          createdEvents: [],
          eventAdmin: [],
          pledges: [],
          campaigns: [],
        },
      };
    }),
  );
};
