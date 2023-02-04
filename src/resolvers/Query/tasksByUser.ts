import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Task } from "../../models";
import { getSort } from "./helper_funtions/getSort";

export const tasksByUser: QueryResolvers["tasksByUser"] = async (
  _parent,
  args
) => {
  const sort = getSort(args.orderBy);

  return await Task.find({
    creator: args.id,
  })
    .sort(sort)
    .populate("event")
    .populate("creator", "-password")
    .lean();
};
