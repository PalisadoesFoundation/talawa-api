import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceEvent } from "../../models";
import { Event } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

export const eventsByOrganizationConnection: QueryResolvers["eventsByOrganizationConnection"] =
  async (_parent, args) => {
    let where = getWhere<InterfaceEvent>(args.where);
    const sort = getSort(args.orderBy);

    where = {
      ...where,
      status: "ACTIVE",
    };

    const events = await Event.find(where)
      .sort(sort)
      .limit(args.first ?? 0)
      .skip(args.skip ?? 0)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    return events;
  };
