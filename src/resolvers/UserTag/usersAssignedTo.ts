import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceTagUser, InterfaceUser } from "../../models";
import { TagUser } from "../../models";
import {
  transformArguments,
  getLimit,
  getSortingObject,
  getFilterObject,
  generateConnectionObject,
} from "../../utilities/graphqlConnectionFactory";
import { validatePaginationArgs } from "../../libraries/validators/validatePaginationArgs";

export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args
) => {
  const errors = validatePaginationArgs(args);

  if (errors.length !== 0) {
    return {
      data: null,
      errors,
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
