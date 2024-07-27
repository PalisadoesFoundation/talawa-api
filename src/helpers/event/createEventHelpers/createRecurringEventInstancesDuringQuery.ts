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
 * Creates instances of recurring events up to a specified date during queries.
 *
 * @param organizationId - The ID of the organization to which the events belong.
 *
 * @see Parent file:
 * - `resolvers/Mutation/createEvent.ts.`
 * - `resolvers/Query/eventsByOrganizationConnection.ts.`
 *
 * @remarks
 * This function follows these steps:
 * 1. Calculates the date limit up to which recurrence rules are queried and new instances are generated.
 * 2. Retrieves recurrence rules based on the organization ID and their latest instance dates.
 * 3. For each recurrence rule found:
 *   - Finds the base recurring event to gather data for new instance generation.
 *   - Determines how many existing instances exist and calculates how many new instances to generate.
 *   - Generates new instances starting from the latest instance date recorded.
 *   - Updates the latest instance date for the recurrence rule.
 *
 */
export const createRecurringEventInstancesDuringQuery = async (
  organizationId: string | undefined | null,
): Promise<void> => {
  if (!organizationId) {
    return;
  }

  // Get the current UTC date at midnight
  const calendarDate = convertToUTCDate(new Date());
  const queryUptoDate = addYears(
    calendarDate,
    RECURRING_EVENT_INSTANCES_QUERY_LIMIT,
  );

  // Retrieve recurrence rules that require new instances
  const recurrenceRules = await RecurrenceRule.find({
    organizationId,
    latestInstanceDate: { $lt: queryUptoDate },
  }).lean();

  await Promise.all(
    recurrenceRules.map(async (recurrenceRule) => {
      // Find the base recurring event associated with the recurrence rule
      const baseRecurringEvent = await Event.find({
        _id: recurrenceRule.baseRecurringEventId,
      }).lean();

      // Extract necessary data from the base recurring event
      const { _id: baseRecurringEventId, ...data } = baseRecurringEvent[0];

      // Prepare input data for generating recurring event instances
      const currentInputData: InterfaceRecurringEvent = {
        ...data,
        organizationId: recurrenceRule.organizationId.toString(),
      };

      // Extract properties from the recurrence rule
      const {
        _id: recurrenceRuleId,
        recurrenceEndDate,
        recurrenceRuleString,
        latestInstanceDate,
        count: totalInstancesCount,
      } = recurrenceRule;

      // Determine the start date for generating new instances
      const currentRecurrenceStartDate = addDays(latestInstanceDate, 1);

      // Calculate dates for new recurring instances
      let recurringInstanceDates = getRecurringInstanceDates(
        recurrenceRuleString,
        currentRecurrenceStartDate,
        recurrenceEndDate,
        queryUptoDate,
      );

      // Adjust the number of instances to generate based on specified count
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

      // Start a transaction if a session is available
      if (session) {
        session.startTransaction();
      }

      try {
        // Generate new instances if dates are available
        if (recurringInstanceDates && recurringInstanceDates.length) {
          const updatedLatestRecurringInstanceDate =
            recurringInstanceDates[recurringInstanceDates.length - 1];

          // Update the latest instance date for the recurrence rule
          await RecurrenceRule.updateOne(
            {
              _id: recurrenceRuleId,
            },
            {
              latestInstanceDate: updatedLatestRecurringInstanceDate,
            },
            { session },
          );

          // Generate recurring event instances
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

        // Commit the transaction if everything is successful
        if (session) {
          await session.commitTransaction();
        }
      } catch (error) {
        // Abort the transaction if an error occurs
        if (session) {
          await session.abortTransaction();
        }
        throw error;
      }
    }),
  );
};
