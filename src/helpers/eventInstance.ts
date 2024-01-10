import type mongoose from "mongoose";
import { Event } from "../models";

//Function for creating single events

export async function generateSingleEvent(
  args: any,
  currentUser: any,
  organization: any,
  session: mongoose.ClientSession
) {
  const createdEvent = await Event.create(
    [
      {
        ...args.data,
        creator: currentUser._id,
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
  args: any,
  currentUser: any,
  organization: any,
  session: mongoose.ClientSession
) {
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
      creator: currentUser._id,
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
