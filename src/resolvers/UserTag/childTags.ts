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

export const childTags: UserTagResolvers["childTags"] = async (
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

  const allChildTagObjects = await OrganizationTagUser.find({
    ...getFilterObject(newArgs),
    parentTagId: parent._id,
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
  >(newArgs, allChildTagObjects, (tag) => tag);
};
