import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import { errors } from "../../libraries";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { getSort } from "./helperFunctions/getSort";

export const organizations: QueryResolvers["organizations"] = async (
  _parent,
  args
) => {
  const sort = getSort(args.orderBy);

  if (args.id) {
    const organizationFound = await Organization.find({
      _id: args.id,
    })
      .sort(sort)
      .lean();

    if (!organizationFound[0]) {
      throw new errors.NotFoundError(
        ORGANIZATION_NOT_FOUND_ERROR.DESC,
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    return organizationFound;
  } else {
    return await Organization.find().sort(sort).limit(100).lean();
  }
};
