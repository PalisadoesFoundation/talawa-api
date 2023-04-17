import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, InterfaceTagUser, InterfaceUser } from "../../models";
import {
  createGraphQLConnection,
  validatePaginationArgs,
  transformArguments,
  getLimit,
  getSortingObject,
} from "../../utilities/graphqlConnectionFactory";

// @ts-ignore
export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  const connectionErrors = validatePaginationArgs(args);

  if (connectionErrors.length !== 0) {
    return {
      connectionData: null,
      connectionErrors,
    };
  }

  const newArgs = transformArguments(args);

  const allUsers = await TagUser.find({
    tagId: parent._id,
  })
    .sort(
      getSortingObject(newArgs, {
        // The default sorting logic of ascending order by MongoID should always be provided
        _id: 1,
      })
    )
    .limit(getLimit(newArgs))
    .populate("userId")
    .lean();
};
