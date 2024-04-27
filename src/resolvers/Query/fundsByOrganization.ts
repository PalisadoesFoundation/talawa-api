import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getWhere } from "./helperFunctions/getWhere";

export const fundsByOrganization: QueryResolvers["fundsByOrganization"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceFund>(args.where);

    const funds = await Fund.find({
      organizationId: args.organizationId,
      ...where,
    });

    return funds;
  };
