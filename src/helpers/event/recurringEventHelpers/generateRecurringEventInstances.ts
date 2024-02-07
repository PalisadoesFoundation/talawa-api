import type mongoose from "mongoose";
import { format } from "date-fns";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { EventInput } from "../../../types/generatedGraphQLTypes";

/**
 * This function generates the recurring event instances.
 * @param data - the EventInput data provided in the args.
 * @param baseRecurringEventId - _id of the baseRecurringEvent.
 * @param recurrenceRuleId - _id of the recurrenceRule document containing the recurrence rule that the instances follow.
 * @param recurringInstanceDates - the dates of the recurring instances.
 * @param currentUserId - _id of the current user.
 * @param organizationId - _id of the current organization.
 * @remarks The following steps are followed:
 * 1. Generate the instances for each provided date.
 * 2. Insert the documents in the database.
 * @returns The recurring instances generated during this operation.
 */

interface InterfaceGenerateRecurringInstances {
  data: EventInput;
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
  data,
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
      ...data,
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
