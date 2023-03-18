import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_Organization, Organization } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getInputArgs } from "./helperFunctions/getInputArgs";
import { FilterQuery } from "mongoose";

export const organizationsConnection: QueryResolvers["organizationsConnection"] =
  async (_parent, args) => {
    const inputArg: FilterQuery<Interface_Organization> = getInputArgs(
      args.where
    );
    const sort = getSort(args.orderBy);

    const organizations = await Organization.find(inputArg)
      .sort(sort)
      .limit(args.first!)
      .skip(args.skip!)
      .lean();

    return organizations;
  };
