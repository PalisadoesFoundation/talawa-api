import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Task } from "../../models";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch the list of tasks for an Event in specified order from database.
 * @param _parent-
 * @param args - An object that contains `id` of an Event and `orderBy`.
 * @returns An object that contains list of the tasks.
 * @remarks The query function uses `getSort()` function to sort the data in specified.
 */
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
