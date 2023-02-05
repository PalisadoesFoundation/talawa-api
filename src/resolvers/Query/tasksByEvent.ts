import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Task } from "../../models";
import { getSort } from "./helperFunctions/getSort";

export const tasksByEvent: QueryResolvers["tasksByEvent"] = async (
  _parent,
  args
) => {
  const sort = getSort(args.orderBy);

  return await Task.find({
    event: args.id,
  })
    .sort(sort)
    .populate("event")
    .populate("creator", "-password")
    .lean();
};
