import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { TagUser, InterfaceTagUser, InterfaceUser } from "../../models";
import {
  transformArguments,
  getLimit,
  getSortingObject,
  getFilterObject,
  generateConnectionObject,
} from "../../utilities/graphqlConnectionFactory";
import { validatePaginationArgs } from "../../libraries/validators/validatePaginationArgs";

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

  const allUserObjects = await TagUser.find({
    tagId: parent._id,
    ...getFilterObject(newArgs),
  })
    .sort(
      getSortingObject(newArgs.direction, {
        // The default sorting logic of ascending order by MongoID should always be provided
        _id: 1,
      })
    )
    .limit(getLimit(newArgs))
    .populate("userId")
    .lean();

  return generateConnectionObject<InterfaceUser, InterfaceTagUser>(
    newArgs,
    allUserObjects,
    (userTag) => userTag.userId
  );
};
