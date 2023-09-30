import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { UNAUTHENTICATED_ERROR } from "../../constants";
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
  context
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
      UNAUTHENTICATED_ERROR.PARAM
    );
  }
  const filterCriteria = {
    ...where,
    ...(args.userType ? { userType: args.userType } : {}),
  };
  if (args.adminApproved === true) {
    filterCriteria.adminApproved = true;
  } else if (args.adminApproved === false) {
    filterCriteria.adminApproved = false;
  }

  const users = await User.find(filterCriteria)
    .sort(sort)
    .limit(args.first ?? 0)
    .skip(args.skip ?? 0)
    .select(["-password"])
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .populate("organizationsBlockedBy")
    .lean();

  return users.map((user) => {
    const { userType } = currentUser;

    return {
      ...user,
      image: user.image ? `${context.apiRootUrl}${user.image}` : null,
      organizationsBlockedBy:
        (userType === "ADMIN" || userType === "SUPERADMIN") &&
        currentUser._id !== user._id
          ? user.organizationsBlockedBy
          : [],
    };
  });
};
