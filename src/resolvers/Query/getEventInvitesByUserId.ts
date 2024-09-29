import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventAttendee } from "../../models";
/**
 * This query will fetch all the Event Invites in specified order from the database.
 * @param _parent-
 * @param args - An object containing userId.
 * @param context-
 * @returns An object that contains list of all Event Attendees.
 */
export const getEventInvitesByUserId: QueryResolvers["getEventInvitesByUserId"] =
  async (_parent, args) => {
    const eventAttendee = await EventAttendee.find({
      userId: args.userId,
      isInvited: true,
    }).lean();

    return eventAttendee;
  };
