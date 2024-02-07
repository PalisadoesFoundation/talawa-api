import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { MutationCreateEventArgs } from "../../../types/generatedGraphQLTypes";

export const createSingleEvent = async (
  args: Partial<MutationCreateEventArgs>,
  currentUserId: string,
  organizationId: string,
  session: mongoose.ClientSession
): Promise<Promise<InterfaceEvent>> => {
  const createdEvent = await Event.create(
    [
      {
        ...args.data,
        creatorId: currentUserId,
        admins: [currentUserId],
        organization: organizationId,
      },
    ],
    { session }
  );

  return createdEvent[0];
};
