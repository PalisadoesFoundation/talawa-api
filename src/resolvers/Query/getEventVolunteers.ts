import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventVolunteer } from "../../models";
/**
 * This query will fetch all events volunteers for the given eventId from database.
 * @param _parent-
 * @param args - An object that contains `id` of the Event.
 * @returns An object that holds all Event Volunteers for the given Event
 */
export const getEventVolunteers: QueryResolvers["getEventVolunteers"] = async (
  _parent,
  args,
) => {
  const eventId = args.id;

  const volunteers = EventVolunteer.find({
    event: eventId,
  })
    .populate("userId", "-password")
    .lean();

  return volunteers;
};
