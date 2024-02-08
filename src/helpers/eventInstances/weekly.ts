import type mongoose from "mongoose";
import type {
  InterfaceEvent,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { Event } from "../../models";
import type { MutationCreateEventArgs } from "../../types/generatedGraphQLTypes";
import { eachDayOfInterval, format } from "date-fns";

interface InterfaceRecurringEvent extends MutationCreateEventArgs {
  startDate: Date;
  creatorId: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  organization: mongoose.Types.ObjectId;
}

export async function generateEvents(
  args: Partial<MutationCreateEventArgs>,
  currentUser: InterfaceUser,
  organization: InterfaceOrganization,
  session: mongoose.ClientSession
): Promise<InterfaceEvent[]> {
  const recurringEvents: InterfaceRecurringEvent[] = [];
  const { data } = args;

  const startDate = new Date(data?.startDate);
  const endDate = new Date(data?.endDate);

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const occurrences = allDays.filter(
    (date) => date.getDay() === startDate.getDay()
  );

  occurrences.map((date) => {
    const formattedDate = format(date, "yyyy-MM-dd");

    const createdEvent = {
      ...data,
      startDate: new Date(formattedDate),
      creatorId: currentUser._id,
      admins: [currentUser._id],
      organization: organization._id,
    };

    recurringEvents.push(createdEvent);
  });

  //Bulk insertion in database
  const weeklyEvents = await Event.insertMany(recurringEvents, { session });

  return Array.isArray(weeklyEvents) ? weeklyEvents : [weeklyEvents];
}
