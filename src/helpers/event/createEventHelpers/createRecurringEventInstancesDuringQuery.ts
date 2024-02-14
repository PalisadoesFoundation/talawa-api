import { addDays, addYears } from "date-fns";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import { convertToUTCDate } from "../../../utilities/recurrenceDatesUtil";
import { Event } from "../../../models";
import {
  generateRecurringEventInstances,
  getRecurringInstanceDates,
} from "../recurringEventHelpers";
import { session } from "../../../db";
import type { Recurrance } from "../../../types/generatedGraphQLTypes";
import type { InterfaceGenerateRecurringInstancesData } from "../recurringEventHelpers/generateRecurringEventInstances";
import { RECURRING_EVENT_INSTANCES_QUERY_LIMIT } from "../../../constants";

/**
 * This function creates the instances of a recurring event upto a certain date during queries.
 * @param organizationId - _id of the organization the events belong to
 * @remarks The following steps are followed:
 * 1. Get the limit date upto which we would want to query the recurrenceRules and generate new instances.
 * 2. Get the recurrence rules to be used for instance generation during this query.
 * 3. For every recurrence rule found:
 *   - get the number of existing instances and how many more to generate based on the recurrenceRule's count (if specified).
 *   - generate new instances after their latestInstanceDates.
 *   - update the latestInstanceDate.
 */

export const createRecurringEventInstancesDuringQuery = async (
  organizationId: string | undefined | null
): Promise<void> => {
  if (!organizationId) {
    return;
  }

  // get the current calendar date in UTC midnight
  const calendarDate = convertToUTCDate(new Date());
  const queryUptoDate = addYears(
    calendarDate,
    RECURRING_EVENT_INSTANCES_QUERY_LIMIT
  );

  // get the recurrenceRules
  const recurrenceRules = await RecurrenceRule.find({
    organizationId,
    latestInstanceDate: { $lt: queryUptoDate },
  }).lean();

  await Promise.all(
    recurrenceRules.map(async (recurrenceRule) => {
      // find the baseRecurringEvent for the recurrenceRule
      const baseRecurringEvent = await Event.findOne({
        _id: recurrenceRule.baseRecurringEventId,
      }).lean();

      if (!baseRecurringEvent) {
        throw new Error();
      }

      // get the data from the baseRecurringEvent
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, recurrance, ...data } = baseRecurringEvent;

      // get the input data for the generateRecurringEventInstances function
      const currentInputData: InterfaceGenerateRecurringInstancesData = {
        ...data,
        organizationId: recurrenceRule.organizationId.toString(),
        recurrance: recurrance as Recurrance,
      };

      // get the latestInstanceDate of the current recurrenceRule
      const latestInstanceDate = recurrenceRule.latestInstanceDate;
      // get the date from which new instances would be generated
      const recurrenceStartDate = addDays(latestInstanceDate, 1);

      // get the dates for recurrence
      let recurringInstanceDates = getRecurringInstanceDates(
        recurrenceRule.recurrenceRuleString,
        recurrenceStartDate,
        recurrenceRule.endDate,
        queryUptoDate
      );

      // find out how many instances following the recurrence rule already exist and how many more to generate
      const { count: totalInstancesCount } = recurrenceRule;
      if (totalInstancesCount) {
        const totalExistingInstances = await Event.countDocuments({
          recurrenceRuleId: recurrenceRule._id,
        });

        const remainingInstances = totalInstancesCount - totalExistingInstances;

        recurringInstanceDates = recurringInstanceDates.slice(
          0,
          Math.min(recurringInstanceDates.length, remainingInstances)
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
              _id: recurrenceRule._id,
            },
            {
              latestInstanceDate: updatedLatestRecurringInstanceDate,
            },
            { session }
          );

          // generate recurring event instances
          await generateRecurringEventInstances({
            data: currentInputData,
            baseRecurringEventId: baseRecurringEvent._id.toString(),
            recurrenceRuleId: recurrenceRule._id.toString(),
            recurringInstanceDates,
            currentUserId: baseRecurringEvent.creatorId,
            organizationId,
            session,
          });
        }

        /* c8 ignore start */
        if (session) {
          // commit transaction if everything's successful
          await session.commitTransaction();
        }

        /* c8 ignore stop */
      } catch (error) {
        /* c8 ignore start */
        if (session) {
          // abort transaction if something fails
          await session.abortTransaction();
        }

        throw error;
      }

      /* c8 ignore stop */
    })
  );
};
