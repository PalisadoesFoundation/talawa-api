import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

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

  return fund ?? ({} as InterfaceFund);
};
