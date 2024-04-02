import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";
/**
 * This query will fetch all the Event Invites in specified order from the database.
 * @param _parent-
 * @param args - An object containing `orderBy` and `id` of the Organization.
 * @param context- 
 * @returns An object that contains list of all events.
 */
export const getEventInvitesByUserId: QueryResolvers["getEventAttendeesByEventId"] =
  async (_parent, args, context) => {
    const eventAttendees = await EventAttendee.find({
      userId: context.userId,
    }).lean();

    return eventAttendees;
  };