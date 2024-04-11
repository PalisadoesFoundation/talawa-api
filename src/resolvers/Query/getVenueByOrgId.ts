import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceVenue } from "../../models";
import { Venue } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";
import { getSort } from "./helperFunctions/getSort";

export const getVenueByOrgId: QueryResolvers["getVenueByOrgId"] = async (
  _parent,
  args,
) => {
  const where = getWhere<InterfaceVenue>(args.where);
  const sort = getSort(args.orderBy);

  return await Venue.find({
    organization: args.orgId,
    ...where,
  })
    .limit(args.first ?? 0)
    .skip(args.skip ?? 0)
    .sort(sort)
    .lean();
};
