import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
<<<<<<< HEAD
=======
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";
>>>>>>> develop

/**
 * This query will fetch the fund as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the fund.
 * @returns A `fund` object.
 */ //@ts-expect-error - type error
export const getFundById: QueryResolvers["getFundById"] = async (
  _parent,
  args,
) => {
<<<<<<< HEAD
  const fund = await Fund.findOne({
    _id: args.id,
  }).lean();
=======
  const sort = getSort(args.orderBy);
  const where = getWhere<InterfaceFund>(args.where);
  const fund = await Fund.findOne({
    _id: args.id,
  })
    .populate({
      path: "campaigns",
      match: {
        ...where,
      },
      options: {
        sort: sort,
      },
    })
    .lean();
>>>>>>> develop

  return fund ?? ({} as InterfaceFund);
};
