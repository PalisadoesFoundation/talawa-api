import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";

export const getEventAttendee: QueryResolvers["getEventAttendee"] = async (
  _parent,
  args,
) => {
  const eventAttendee = await EventAttendee.findOne({
    eventId: args.eventId,
    userId: args.userId,
  }).lean();

  return eventAttendee;
};
