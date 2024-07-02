import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

export const fundsByOrganization: QueryResolvers["fundsByOrganization"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceFund>(args.where);
    const sort = getSort(args.orderBy);

    const funds = await Fund.find({
      organizationId: args.organizationId,
      ...where,
    }).sort(sort);

    return funds;
  };
