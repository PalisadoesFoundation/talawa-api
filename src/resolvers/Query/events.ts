import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { getSort } from "./helperFunctions/getSort";

export const events: QueryResolvers["events"] = async (_parent, args) => {
  const sort = getSort(args.orderBy);

  const events = await Event.find({
    status: "ACTIVE",
  })
    .sort(sort)
    .populate("creator", "-password")
    .populate("tasks")
    .populate("admins", "-password")
    .lean();

  return events;
};
