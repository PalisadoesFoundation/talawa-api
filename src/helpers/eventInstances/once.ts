import type mongoose from "mongoose";
import type {
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { Event } from "../../models";
import type { MutationCreateEventArgs } from "../../types/generatedGraphQLTypes";

export async function generateEvent(
  args: Partial<MutationCreateEventArgs>,
  currentUser: InterfaceUser,
  organization: InterfaceOrganization,
  session: mongoose.ClientSession
): Promise<Promise<InterfaceEvent[]>> {
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
