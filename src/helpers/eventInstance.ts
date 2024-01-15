import type mongoose from "mongoose";
import type {
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../models";
import { Event } from "../models";
import type { MutationCreateEventArgs } from "../types/generatedGraphQLTypes";

//Function for creating single events

export async function generateSingleEvent(
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

//Function for creating Weekly events

export async function generateWeeklyEvents(
  args: Partial<MutationCreateEventArgs>,
  currentUser: InterfaceUser,
  organization: InterfaceOrganization,
  session: mongoose.ClientSession
): Promise<InterfaceEvent[]> {
  const recurringEvents = [];
  const { data } = args;

  const startDate = new Date(data?.startDate);
  const endDate = new Date(data?.endDate);

  while (startDate <= endDate) {
    const recurringEventData = {
      ...data,
      startDate: new Date(startDate),
    };

    const createdEvent = {
      ...recurringEventData,
      creatorId: currentUser._id,
      admins: [currentUser._id],
      organization: organization._id,
    };

    recurringEvents.push(createdEvent);

    startDate.setDate(startDate.getDate() + 7);
  }

  //Bulk insertion in database
  const weeklyEvents = await Event.insertMany(recurringEvents, { session });

  return Array.isArray(weeklyEvents) ? weeklyEvents : [weeklyEvents];
}
