import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceTagUser, InterfaceUser } from "../../models";
import { TagUser } from "../../models";
import {
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
  const errors = validatePaginationArgs(args.input);

  if (errors.length !== 0) {
    return {
      data: null,
      errors,
    };
  }

  const allUserObjects = await TagUser.find({
    tagId: parent._id,
    ...getFilterObject(args.input),
  })
    .sort(
      getSortingObject(args.input.direction, {
        // The default sorting logic of ascending order by MongoID should always be provided
        _id: 1,
      })
    )
    .limit(getLimit(args.input))
    .populate("userId")
    .lean();

  return generateConnectionObject<InterfaceUser, InterfaceTagUser>(
    args.input,
    allUserObjects,
    (userTag) => userTag.userId
  );
};
