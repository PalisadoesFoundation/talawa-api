import type mongoose from "mongoose";
import type {
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { Event } from "../../models";
import type { MutationCreateEventArgs } from "../../types/generatedGraphQLTypes";
import { EventConflict } from "../eventConflicts";
import { VENUE_ALREADY_SCHEDULED } from "../../constants";
import { errors, requestContext } from "../../libraries";

export async function generateEvent(
  args: Partial<MutationCreateEventArgs>,
  currentUser: InterfaceUser,
  organization: InterfaceOrganization,
  session: mongoose.ClientSession
): Promise<Promise<InterfaceEvent[]>> {
  const eventConflicts = await EventConflict.check(args);
  if (eventConflicts.length > 0) {
    throw new errors.ConflictError(
      requestContext.translate(VENUE_ALREADY_SCHEDULED.MESSAGE),
      VENUE_ALREADY_SCHEDULED.CODE,
      VENUE_ALREADY_SCHEDULED.PARAM
    );
  }
  
  const createdEvent = await Event.create(
    [
      {
        ...args.data,
        creatorId: currentUser._id,
        admins: [currentUser._id],
        organization: organization._id,
      },
    ],
    { session }
  );

  return createdEvent;
}
