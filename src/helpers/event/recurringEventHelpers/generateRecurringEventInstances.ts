import type mongoose from "mongoose";
import { format } from "date-fns";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { EventInput } from "../../../types/generatedGraphQLTypes";

interface InterfaceGenerateRecurringInstances {
  eventData: EventInput;
  baseRecurringEventId: string;
  recurrenceRuleId: string;
  recurringInstanceDates: Date[];
  currentUserId: string;
  organizationId: string;
  session: mongoose.ClientSession;
}

interface InterfaceRecurringEvent extends EventInput {
  isBaseRecurringEvent: boolean;
  recurrenceRuleId: string;
  baseRecurringEventId: string;
  creatorId: string;
  admins: string[];
  organization: string;
}

export const generateRecurringEventInstances = async ({
  eventData,
  baseRecurringEventId,
  recurrenceRuleId,
  recurringInstanceDates,
  currentUserId,
  organizationId,
  session,
}: InterfaceGenerateRecurringInstances): Promise<InterfaceEvent[]> => {
  const recurringInstances: InterfaceRecurringEvent[] = [];
  recurringInstanceDates.map((date) => {
    const formattedInstanceDate = format(date, "yyyy-MM-dd");

    const createdEventInstance = {
      ...eventData,
      startDate: formattedInstanceDate,
      endDate: formattedInstanceDate,
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRuleId,
      baseRecurringEventId: baseRecurringEventId,
      creatorId: currentUserId,
      admins: [currentUserId],
      organization: organizationId,
    };

    recurringInstances.push(createdEventInstance);
  });

  //Bulk insertion in database
  let recurringEventInstances = await Event.insertMany(recurringInstances, {
    session,
  });

  recurringEventInstances = Array.isArray(recurringEventInstances)
    ? recurringEventInstances
    : [recurringEventInstances];

  return recurringEventInstances;
};
