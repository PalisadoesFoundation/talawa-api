import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
<<<<<<< HEAD
=======
import { getSort } from "./helperFunctions/getSort";
>>>>>>> develop
import { getWhere } from "./helperFunctions/getWhere";

export const fundsByOrganization: QueryResolvers["fundsByOrganization"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceFund>(args.where);
<<<<<<< HEAD
=======
    const sort = getSort(args.orderBy);
>>>>>>> develop

    const funds = await Fund.find({
      organizationId: args.organizationId,
      ...where,
<<<<<<< HEAD
    });
=======
    }).sort(sort);
>>>>>>> develop

    return funds;
  };
