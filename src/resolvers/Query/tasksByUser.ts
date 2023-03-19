import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Task } from "../../models";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch the list of tasks created by the user in an specified order from the database.
 * @param _parent
 * @param args - An object that contains `id` of the user and `orderBy`.
 * @returns An object that contains the list of all the task created by the user.
 */
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
