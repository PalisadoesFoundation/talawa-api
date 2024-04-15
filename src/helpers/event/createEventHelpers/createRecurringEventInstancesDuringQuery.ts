import { addDays, addYears } from "date-fns";
import { convertToUTCDate } from "../../../utilities/recurrenceDatesUtil";
import { Event, RecurrenceRule } from "../../../models";
import {
  generateRecurringEventInstances,
  getRecurringInstanceDates,
} from "../recurringEventHelpers";
import { session } from "../../../db";
import type { InterfaceRecurringEvent } from "../recurringEventHelpers/generateRecurringEventInstances";
import { RECURRING_EVENT_INSTANCES_QUERY_LIMIT } from "../../../constants";

/**
 * This function creates the instances of a recurring event upto a certain date during queries.
 * @param organizationId - _id of the organization the events belong to
 * @remarks The following steps are followed:
 * 1. Get the limit date upto which we would want to query the recurrenceRules and generate new instances.
 * 2. Get the recurrence rules to be used for instance generation during this query.
 * 3. For every recurrence rule found:
 *   - find the base recurring event to get the data to be used for new instance generation.
 *   - get the number of existing instances and how many more to generate based on the recurrenceRule's count (if specified).
 *   - generate new instances after their latestInstanceDates.
 *   - update the latestInstanceDate.
 */

export const createRecurringEventInstancesDuringQuery = async (
  organizationId: string | undefined | null,
): Promise<void> => {
  if (!organizationId) {
    return;
  }

  // get the current calendar date in UTC midnight
  const calendarDate = convertToUTCDate(new Date());
  const queryUptoDate = addYears(
    calendarDate,
    RECURRING_EVENT_INSTANCES_QUERY_LIMIT,
  );

  // get the recurrenceRules
  const recurrenceRules = await RecurrenceRule.find({
    organizationId,
    latestInstanceDate: { $lt: queryUptoDate },
  }).lean();

  await Promise.all(
    recurrenceRules.map(async (recurrenceRule) => {
      // find the baseRecurringEvent for the recurrenceRule
      const baseRecurringEvent = await Event.find({
        _id: recurrenceRule.baseRecurringEventId,
      }).lean();

      // get the data from the baseRecurringEvent
      const { _id: baseRecurringEventId, ...data } = baseRecurringEvent[0];

      // get the input data for the generateRecurringEventInstances function
      const currentInputData: InterfaceRecurringEvent = {
        ...data,
        organizationId: recurrenceRule.organizationId.toString(),
      };

      // get the properties from recurrenceRule
      const {
        _id: recurrenceRuleId,
        recurrenceEndDate,
        recurrenceRuleString,
        latestInstanceDate,
        count: totalInstancesCount,
      } = recurrenceRule;

      // get the date from which new instances would be generated
      const currentRecurrenceStartDate = addDays(latestInstanceDate, 1);

      // get the dates for recurrence
      let recurringInstanceDates = getRecurringInstanceDates(
        recurrenceRuleString,
        currentRecurrenceStartDate,
        recurrenceEndDate,
        queryUptoDate,
      );

      // find out how many instances following the recurrence rule already exist and how many more to generate
      if (totalInstancesCount) {
        const totalExistingInstances = await Event.countDocuments({
          recurrenceRuleId,
        });

        const remainingInstances = totalInstancesCount - totalExistingInstances;

        recurringInstanceDates = recurringInstanceDates.slice(
          0,
          Math.min(recurringInstanceDates.length, remainingInstances),
        );
      }

      /* c8 ignore start */
      if (session) {
        // start a transaction
        session.startTransaction();
      }

      /* c8 ignore stop */
      try {
        if (recurringInstanceDates && recurringInstanceDates.length) {
          const updatedLatestRecurringInstanceDate =
            recurringInstanceDates[recurringInstanceDates.length - 1];

          // update the latestInstanceDate of the recurrenceRule
          await RecurrenceRule.updateOne(
            {
              _id: recurrenceRuleId,
            },
            {
              latestInstanceDate: updatedLatestRecurringInstanceDate,
            },
            { session },
          );

          // generate recurring event instances
          await generateRecurringEventInstances({
            data: currentInputData,
            baseRecurringEventId: baseRecurringEventId.toString(),
            recurrenceRuleId: recurrenceRuleId.toString(),
            recurringInstanceDates,
            creatorId: baseRecurringEvent[0].creatorId.toString(),
            organizationId,
            session,
          });
        }

        /* c8 ignore start */
        if (session) {
          // commit transaction if everything's successful
          await session.commitTransaction();
        }
      } catch (error) {
        if (session) {
          // abort transaction if something fails
          await session.abortTransaction();
        }

        throw error;
      }

      /* c8 ignore stop */
    }),
  );
};
