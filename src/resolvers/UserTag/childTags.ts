import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import {
  OrganizationTagUser,
  InterfaceOrganizationTagUser,
} from "../../models";
import {
  transformArguments,
  getLimit,
  getSortingObject,
  getFilterQuery,
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
    ...getFilterQuery(newArgs),
  })
    .sort(
      getSortingObject(newArgs, {
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
