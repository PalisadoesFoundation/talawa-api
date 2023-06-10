import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceOrganizationTagUser } from "../../models";
import { OrganizationTagUser } from "../../models";
import {
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
  const errors = validatePaginationArgs(args.input);

  if (errors.length !== 0) {
    return {
      data: null,
      errors,
    };
  }

  const allChildTagObjects = await OrganizationTagUser.find({
    ...getFilterObject(args.input),
    parentTagId: parent._id,
  })
    .sort(
      getSortingObject(args.input.direction, {
        // The default sorting logic of ascending order by MongoID should always be provided
        _id: 1,
        name: 1,
      })
    )
    .limit(getLimit(args.input))
    .populate("userId")
    .lean();

  return generateConnectionObject<
    InterfaceOrganizationTagUser,
    InterfaceOrganizationTagUser
  >(args.input, allChildTagObjects, (tag) => tag);
};
