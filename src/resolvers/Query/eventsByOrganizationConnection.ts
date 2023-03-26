import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event, Interface_Event, Interface_UserAttende } from "../../models";
import { STATUS_ACTIVE } from "../../constants";
import { getSort } from "./helperFunctions/getSort";
import { getInputArgs } from "./helperFunctions/getInputArgs";
import { FilterQuery } from "mongoose";

export const eventsByOrganizationConnection: QueryResolvers["eventsByOrganizationConnection"] =
  async (_parent, args) => {
    let inputArg: FilterQuery<Interface_Event> = getInputArgs(args.where);
    const sort = getSort(args.orderBy);

    inputArg = {
      ...inputArg,
      status: "ACTIVE",
    };

    const events = await Event.find(inputArg as Interface_Event)
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
