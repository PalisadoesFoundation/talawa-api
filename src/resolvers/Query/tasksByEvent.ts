import {
  InputMaybe,
  QueryResolvers,
  TaskOrderByInput,
} from "../../types/generatedGraphQLTypes";
import { Task } from "../../models";

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
