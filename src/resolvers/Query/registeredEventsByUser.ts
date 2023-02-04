import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { getSort } from "./helper_funtions/getSort";

export const registeredEventsByUser: QueryResolvers["registeredEventsByUser"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    return await Event.find({
      status: "ACTIVE",
      registrants: {
        $elemMatch: {
          userId: args.id,
          status: "ACTIVE",
        },
      },
    })
      .sort(sort)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();
  };
