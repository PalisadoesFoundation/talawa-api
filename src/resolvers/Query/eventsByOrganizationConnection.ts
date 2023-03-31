import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event, Interface_Event, Interface_UserAttende } from "../../models";
import { STATUS_ACTIVE } from "../../constants";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

export const eventsByOrganizationConnection: QueryResolvers["eventsByOrganizationConnection"] =
  async (_parent, args) => {
    let where = getWhere<Interface_Event>(args.where);
    const sort = getSort(args.orderBy);

    where = {
      ...where,
      status: "ACTIVE",
    };

    const events = await Event.find(where)
      .sort(sort)
      .limit(args.first!)
      .skip(args.skip!)
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    events.forEach((event) => {
      event.registrants = event.registrants.filter(
        (registrant: Interface_UserAttende) =>
          registrant.status === STATUS_ACTIVE
      );
    });

    return events;
  };
