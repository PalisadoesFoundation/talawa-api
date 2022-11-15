import {
  EventOrderByInput,
  InputMaybe,
  QueryResolvers,
} from "../../../generated/graphqlCodegen";
import { Event, Interface_UserAttende } from "../../models";
import { STATUS_ACTIVE } from "../../../constants";

/**
 * This query will fetch all events for the organization which have `ACTIVE` status from database.
 * @param _parent 
 * @param args - An object that contains `orderBy` to sort the object as specified and `id` of the Organization.
 * @returns An `events` object that holds all events with `ACTIVE` status for the Organization.
 */
export const eventsByOrganization: QueryResolvers["eventsByOrganization"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    const events = await Event.find({
      organization: args.id,
      status: "ACTIVE",
    })
      .sort(sort)
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

const getSort = (orderBy: InputMaybe<EventOrderByInput> | undefined) => {
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
    } else if (orderBy === "startDate_ASC") {
      return {
        startDate: 1,
      };
    } else if (orderBy === "startDate_DESC") {
      return {
        startDate: -1,
      };
    } else if (orderBy === "endDate_ASC") {
      return {
        endDate: 1,
      };
    } else if (orderBy === "endDate_DESC") {
      return {
        endDate: -1,
      };
    } else if (orderBy === "allDay_ASC") {
      return {
        allDay: 1,
      };
    } else if (orderBy === "allDay_DESC") {
      return {
        allDay: -1,
      };
    } else if (orderBy === "startTime_ASC") {
      return {
        startTime: 1,
      };
    } else if (orderBy === "startTime_DESC") {
      return {
        startTime: -1,
      };
    } else if (orderBy === "endTime_ASC") {
      return {
        endTime: 1,
      };
    } else if (orderBy === "endTime_DESC") {
      return {
        endTime: -1,
      };
    } else if (orderBy === "recurrance_ASC") {
      return {
        recurrance: 1,
      };
    } else if (orderBy === "recurrance_DESC") {
      return {
        recurrance: -1,
      };
    } else if (orderBy === "location_ASC") {
      return {
        location: 1,
      };
    } else {
      return {
        location: -1,
      };
    }
  }

  return {};
};
