import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { EventInput } from "../../../types/generatedGraphQLTypes";
import {
  createRecurrenceRule,
  generateRecurringEventInstances,
  getRecurringInstanceDates,
} from "../recurringEventHelpers";
import { errors, requestContext } from "../../../libraries";
import { FIELD_NON_EMPTY_ERROR } from "../../../constants";

export const createRecurringEvents = async (
  data: EventInput,
  currentUserId: string,
  organizationId: string,
  session: mongoose.ClientSession
): Promise<InterfaceEvent[]> => {
  if (!data.recurrenceRuleString) {
    throw new errors.InputValidationError(
      requestContext.translate(FIELD_NON_EMPTY_ERROR.MESSAGE),
      FIELD_NON_EMPTY_ERROR.CODE,
      FIELD_NON_EMPTY_ERROR.PARAM
    );
  }

  const { recurrenceRuleString, ...eventData } = data;

  // create a base recurring event first, based on which all the
  // recurring instances would be generated
  const baseRecurringEvent = await Event.create(
    [
      {
        ...eventData,
        recurring: true,
        isBaseRecurringEvent: true,
        creatorId: currentUserId,
        admins: [currentUserId],
        organization: organizationId,
      },
    ],
    { session }
  );

  // get the dates for the recurringInstances, and the date of the last instance
  // to be generated in this operation (rest would be generated dynamically during query)
  const [recurringInstanceDates, latestInstanceDate] =
    getRecurringInstanceDates(
      recurrenceRuleString,
      data.startDate,
      data.endDate
    );

  // create a recurrenceRule document that would contain the recurrence pattern
  const recurrenceRule = await createRecurrenceRule(
    recurrenceRuleString,
    data.startDate,
    data.endDate,
    organizationId.toString(),
    baseRecurringEvent[0]?._id.toString(),
    latestInstanceDate,
    session
  );

  // generate the recurring instances
  const recurringEventInstances = await generateRecurringEventInstances({
    eventData,
    baseRecurringEventId: baseRecurringEvent[0]?._id.toString(),
    recurrenceRuleId: recurrenceRule?._id.toString(),
    recurringInstanceDates,
    currentUserId: currentUserId.toString(),
    organizationId: organizationId.toString(),
    session,
  });

  return recurringEventInstances;
};
