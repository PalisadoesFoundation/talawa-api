import {
  EventOrderByInput,
  InputMaybe,
  QueryResolvers,
} from "../../../generated/graphqlCodegen";
import { Event } from "../../models";

/**
 * This query will fetch all events with `ACTIVE` status and sorts them as specified from database.
 * @param _parent 
 * @param args - An object that contains `orderBy` that helps to sort the object as specified.
 * @returns An `events` object that holds all events with `ACTIVE` status.
 * @remarks You can learn about GraphQL `Resolvers` 
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
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
