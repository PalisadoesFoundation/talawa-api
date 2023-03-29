import {
  EventWhereInput,
  InputMaybe,
  QueryResolvers,
} from "../../types/generatedGraphQLTypes";
import { Event, Interface_Event, Interface_UserAttende } from "../../models";
import { STATUS_ACTIVE } from "../../constants";
import { getSort } from "./helperFunctions/getSort";

export const eventsByOrganizationConnection: QueryResolvers["eventsByOrganizationConnection"] =
  async (_parent, args) => {
    let inputArg = getInputArg(args.where);
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

const getInputArg = (where: InputMaybe<EventWhereInput> | undefined) => {
  let inputArg = {};

  if (where) {
    // Returns provided id event
    if (where.id) {
      inputArg = {
        ...inputArg,
        _id: where.id,
      };
    }

    // Returns all events other than provided id
    if (where.id_not) {
      inputArg = {
        ...inputArg,
        _id: { $ne: where.id_not },
      };
    }

    // Return events with id in the provided list
    if (where.id_in) {
      inputArg = {
        ...inputArg,
        _id: { $in: where.id_in },
      };
    }

    // Returns events not included in provided id list
    if (where.id_not_in) {
      inputArg = {
        ...inputArg,
        _id: { $nin: where.id_not_in },
      };
    }

    // Returns provided title events
    if (where.title) {
      inputArg = {
        ...inputArg,
        title: where.title,
      };
    }

    // Returns events with not that title
    if (where.title_not) {
      inputArg = {
        ...inputArg,
        title: { $ne: where.title_not },
      };
    }

    // Return events with the given list title
    if (where.title_in) {
      inputArg = {
        ...inputArg,
        title: { $in: where.title_in },
      };
    }

    // Returns events with title not in the provided list
    if (where.title_not_in) {
      inputArg = {
        ...inputArg,
        title: { $nin: where.title_not_in },
      };
    }

    // Returns events with title containing provided string
    if (where.title_contains) {
      inputArg = {
        ...inputArg,
        title: { $regex: where.title_contains, $options: "i" },
      };
    }

    // Returns events with title starts with that provided string
    if (where.title_starts_with) {
      const regexp = new RegExp("^" + where.title_starts_with);
      inputArg = {
        ...inputArg,
        title: regexp,
      };
    }

    // Returns provided description events
    if (where.description) {
      inputArg = {
        ...inputArg,
        description: where.description,
      };
    }

    // Returns events with not that description
    if (where.description_not) {
      inputArg = {
        ...inputArg,
        description: { $ne: where.description_not },
      };
    }

    // Return events with description in provided list
    if (where.description_in) {
      inputArg = {
        ...inputArg,
        description: { $in: where.description_in },
      };
    }

    // Return events with description not in provided list
    if (where.description_not_in) {
      inputArg = {
        ...inputArg,
        description: { $nin: where.description_not_in },
      };
    }

    // Return events with description should containing provided string
    if (where.description_contains) {
      inputArg = {
        ...inputArg,
        description: {
          $regex: where.description_contains,
          $options: "i",
        },
      };
    }

    // Returns events with description starting with provided string
    if (where.description_starts_with) {
      const regexp = new RegExp("^" + where.description_starts_with);
      inputArg = {
        ...inputArg,
        description: regexp,
      };
    }

    // Returns events of a specific organization
    if (where.organization_id) {
      inputArg = {
        ...inputArg,
        organization: where.organization_id,
      };
    }

    // Returns provided location events
    if (where.location) {
      inputArg = {
        ...inputArg,
        location: where.location,
      };
    }

    // Returns events with not that location
    if (where.location_not) {
      inputArg = {
        ...inputArg,
        location: { $ne: where.location_not },
      };
    }

    // Return events with location in provided list
    if (where.location_in) {
      inputArg = {
        ...inputArg,
        location: { $in: where.location_in },
      };
    }

    // Return events with location not in provided list
    if (where.location_not_in) {
      inputArg = {
        ...inputArg,
        location: { $nin: where.location_not_in },
      };
    }

    // Return events with location should containing provided string
    if (where.location_contains) {
      inputArg = {
        ...inputArg,
        location: {
          $regex: where.location_contains,
          $options: "i",
        },
      };
    }

    return inputArg;
  }
};
