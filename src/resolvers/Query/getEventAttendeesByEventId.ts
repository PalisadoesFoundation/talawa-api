import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

export const getEventAttendeesByEventId: QueryResolvers["getEventAttendeesByEventId"] =
  async (_parent, args) => {
    const eventAttendees = await EventAttendee.find({
      eventId: args.eventId,
    }).lean();

    return eventAttendees;
  };
