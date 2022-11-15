import {
  InputMaybe,
  QueryResolvers,
  TaskOrderByInput,
} from "../../../generated/graphqlCodegen";
import { Task } from "../../models";

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

const getSort = (orderBy: InputMaybe<TaskOrderByInput> | undefined) => {
  if (orderBy !== null) {
    if (orderBy === "id_ASC") {
      return {
        _id: 1,
      };
    } else if (orderBy === "id_DESC") {
      return {
        _id: -1,
      };
    } else if (orderBy === "title_ASC") {
      return {
        title: 1,
      };
    } else if (orderBy === "title_DESC") {
      return {
        title: -1,
      };
    } else if (orderBy === "description_ASC") {
      return {
        description: 1,
      };
    } else if (orderBy === "description_DESC") {
      return {
        description: -1,
      };
    } else if (orderBy === "createdAt_ASC") {
      return {
        createdAt: 1,
      };
    } else if (orderBy === "createdAt_DESC") {
      return {
        createdAt: -1,
      };
    } else if (orderBy === "deadline_ASC") {
      return {
        deadline: 1,
      };
    } else {
      return {
        deadline: -1,
      };
    }
  }

  return {};
};
