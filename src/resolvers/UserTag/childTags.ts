import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceOrganizationTagUser } from "../../models";
import { OrganizationTagUser } from "../../models";
import {
  transformArguments,
  getLimit,
  getSortingObject,
  getFilterObject,
  generateConnectionObject,
} from "../../utilities/graphqlConnectionFactory";
import { validatePaginationArgs } from "../../libraries/validators/validatePaginationArgs";

// @ts-ignore
export const childTags: UserTagResolvers["childTags"] = async (
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

  const allUserObjects = await OrganizationTagUser.find({
    parentTagId: parent._id,
    ...getFilterObject(newArgs),
  })
    .sort(
      getSortingObject(newArgs.direction, {
        // The default sorting logic of ascending order by MongoID should always be provided
        _id: 1,
        name: 1,
      })
    )
    .limit(getLimit(newArgs))
    .populate("userId")
    .lean();

  return generateConnectionObject<
    InterfaceOrganizationTagUser,
    InterfaceOrganizationTagUser
  >(newArgs, allUserObjects, (tag) => tag);
};
