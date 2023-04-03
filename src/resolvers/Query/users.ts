import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_User, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { UNAUTHENTICATED_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
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
  const where = getWhere<Interface_User>(args.where);
  const sort = getSort(args.orderBy);

  const queryUser = await User.findOne({
    _id: context.userId,
  });

  if (!queryUser) {
    throw new errors.UnauthenticatedError(
      requestContext.translate(UNAUTHENTICATED_ERROR.MESSAGE),
      UNAUTHENTICATED_ERROR.CODE,
      UNAUTHENTICATED_ERROR.PARAM
    );
  }

  const users = await User.find(where)
    .sort(sort)
    .select(["-password"])
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .populate("organizationsBlockedBy")
    .lean();

  if (!users[0]) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  } else
    return users.map((user) => {
      const { userType } = queryUser;

      return {
        ...user,
        image: user.image ? `${context.apiRootUrl}${user.image}` : null,
        organizationsBlockedBy:
          (userType === "ADMIN" || userType === "SUPERADMIN") &&
          queryUser._id !== user._id
            ? user.organizationsBlockedBy
            : [],
      };
    });
};
