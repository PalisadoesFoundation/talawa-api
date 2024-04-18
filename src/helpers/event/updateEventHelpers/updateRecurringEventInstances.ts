import type mongoose from "mongoose";
import type { Types } from "mongoose";
import type { InterfaceEvent, InterfaceRecurrenceRule } from "../../../models";
import {
  AppUserProfile,
  Event,
  EventAttendee,
  RecurrenceRule,
  User,
} from "../../../models";
import type {
  MutationUpdateEventArgs,
  RecurrenceRuleInput,
  RecurringEventMutationType,
} from "../../../types/generatedGraphQLTypes";

import {
  createRecurrenceRule,
  generateRecurrenceRuleString,
  generateRecurringEventInstances,
  getRecurringInstanceDates,
  removeDanglingDocuments,
} from "../recurringEventHelpers";
import { getEventData, shouldUpdateBaseRecurringEvent } from "./index";

/**
 * This function updates this and the following instances of a recurring event.
 * @param args - update event args.
 * @param event - the event to be updated.
 * @param recurrenceRule - the recurrence rule followed by the instances.
 * @param baseRecurringEvent - the base recurring event.
 * @remarks The following steps are followed:
 * 1. Check if the recurrence rule has changed.
 * 2. If the recurrence rule has changed:
 *      - get the appropriate data to create new recurring event instances and update the baseRecurringEvent.
 *      - get the recurrence dates and generate new instances.
 *      - remove the current instances and their associations as a new series has been created.
 *    If the recurrence rule hasn't changed:
 *      - just perform a regular bulk update.
 * 3. Update the base recurring event if required.
 * 4. Removes any dangling recurrence rule and base recurrence rule documents.
 * @returns The updated first instance following the recurrence rule.
 */

export const updateRecurringEventInstances = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  recurringEventUpdateType: RecurringEventMutationType,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  // get the data from the args
  const { data: updateEventInputData, recurrenceRuleData } = args;

  // get the start and end dates of recurrence
  let { recurrenceStartDate, recurrenceEndDate } = recurrenceRule;

  // get the current recurrence rule string
  const { recurrenceRuleString: currentRecurrenceRuleString } = recurrenceRule;

  // whether the recurrence rule has changed
  let hasRecurrenceRuleChanged = false;

  // check if the new recurrence rule is different from the current one
  let newRecurrenceRuleString = "";
  if (recurrenceRuleData) {
    newRecurrenceRuleString = generateRecurrenceRuleString(recurrenceRuleData);

    hasRecurrenceRuleChanged =
      currentRecurrenceRuleString !== newRecurrenceRuleString;
  }

  // whether instance duration has changed
  let hasEventInstanceDurationChanged = false;

  if (updateEventInputData.startDate && updateEventInputData.endDate) {
    const { startDate: newStartDate, endDate: newEndDate } =
      updateEventInputData;
    const { startDate: originalStartDate, endDate: originalEndDate } = event;

    hasEventInstanceDurationChanged =
      newStartDate.toString() !== originalStartDate.toString() ||
      newEndDate.toString() !== originalEndDate?.toString();
  }

  const shouldCreateNewSeries =
    hasRecurrenceRuleChanged || hasEventInstanceDurationChanged;

  // get the query object to filter events to be updated:
  //   - if we're updating thisAndFollowingInstance, it will find all the instances after(and including) this one
  //   - if we're updating allInstances, it will find all the instances
  const eventsQueryObject: {
    recurrenceRuleId: Types.ObjectId;
    baseRecurringEventId: Types.ObjectId;
    isBaseRecurringEvent: boolean;
    isRecurringEventException: boolean;
    startDate?: { $gte: string };
  } = {
    recurrenceRuleId: recurrenceRule._id,
    baseRecurringEventId: baseRecurringEvent._id,
    isBaseRecurringEvent: false,
    isRecurringEventException: false,
  };

  if (recurringEventUpdateType === "thisAndFollowingInstances") {
    eventsQueryObject.startDate = { $gte: event.startDate };
  }

  if (shouldCreateNewSeries) {
    // delete the current series, remove their associations, and generate a new one

    // first, remove the events conforming to the current recurrence rule and their associations
    const recurringEventInstances = await Event.find(
      {
        ...eventsQueryObject,
      },
      null,
      { session },
    );

    const recurringEventInstancesIds = recurringEventInstances.map(
      (recurringEventInstance) => recurringEventInstance._id,
    );

    await Promise.all([
      Event.deleteMany(
        {
          _id: { $in: recurringEventInstancesIds },
        },
        { session },
      ),
      EventAttendee.deleteMany(
        {
          eventId: { $in: recurringEventInstancesIds },
        },
        { session },
      ),
      User.updateOne(
        {
          _id: event.creatorId,
        },
        {
          $pull: {
            registeredEvents: { $in: recurringEventInstancesIds },
          },
        },
        { session },
      ),
      AppUserProfile.updateOne(
        {
          userId: event.creatorId,
        },
        {
          $pull: {
            eventAdmin: { $in: recurringEventInstancesIds },
            createdEvents: { $in: recurringEventInstancesIds },
          },
        },
      ),
    ]);

    // get the instances following the old recurrence rule
    const eventsFollowingCurrentRecurrence = await Event.find(
      {
        recurrenceRuleId: recurrenceRule._id,
        isRecurringEventException: false,
      },
      null,
      { session },
    ).sort({ startDate: -1 });

    if (
      eventsFollowingCurrentRecurrence &&
      eventsFollowingCurrentRecurrence.length
    ) {
      // get the latest instance following the old recurrence rule
      const updatedLatestRecurringInstanceDate = new Date(
        eventsFollowingCurrentRecurrence[0].startDate,
      );
      // find the latest instance for the old recurrence rule and update it
      await RecurrenceRule.findOneAndUpdate(
        {
          _id: recurrenceRule._id,
        },
        {
          latestInstanceDate: updatedLatestRecurringInstanceDate,
          recurrenceEndDate: updatedLatestRecurringInstanceDate,
        },
        { session },
      ).lean();
    }

    // now generate a new series
    // get latest eventData to be used for new recurring instances and base recurring event
    const eventData = getEventData(updateEventInputData, event);

    // get the recurrence start and end dates
    ({ recurrenceStartDate, recurrenceEndDate } =
      recurrenceRuleData as RecurrenceRuleInput);

    // get recurrence dates
    const recurringInstanceDates = getRecurringInstanceDates(
      newRecurrenceRuleString,
      recurrenceStartDate,
      recurrenceEndDate,
    );

    // get the startDate of the latest instance following the recurrence
    const latestInstanceDate =
      recurringInstanceDates[recurringInstanceDates.length - 1];

    // create the recurrencerule
    const newRecurrenceRule = await createRecurrenceRule(
      newRecurrenceRuleString,
      recurrenceStartDate,
      recurrenceEndDate,
      eventData.organizationId,
      baseRecurringEvent._id.toString(),
      latestInstanceDate,
      session,
    );

    // generate the recurring instances and get an instance back
    updatedEvent = await generateRecurringEventInstances({
      data: eventData,
      baseRecurringEventId: baseRecurringEvent._id.toString(),
      recurrenceRuleId: newRecurrenceRule?._id.toString(),
      recurringInstanceDates,
      creatorId: event.creatorId,
      organizationId: eventData.organizationId,
      session,
    });
  } else {
    // perform bulk update on all the events that are queried according to the eventsQueryObject,

    // get the generic data to be updated
    const updateData = { ...args.data };

    // remove the dates from this data because that would change the recurrence pattern
    // and would be covered in the if block above where "hasRecurrenceRuleChanged: true"
    delete updateData.startDate;
    delete updateData.endDate;

    await Event.updateMany(
      {
        ...eventsQueryObject,
      },
      {
        ...updateData,
      },
      {
        session,
      },
    );

    updatedEvent = (await Event.findOne({
      _id: event._id,
    }).lean()) as InterfaceEvent;
  }

  // update the baseRecurringEvent if it is the latest recurrence rule that the instances were following
  if (
    shouldUpdateBaseRecurringEvent(
      recurrenceRule?.recurrenceEndDate?.toString(),
      baseRecurringEvent?.endDate?.toString(),
    )
  ) {
    await Event.updateOne(
      {
        _id: event.baseRecurringEventId,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
        endDate: recurrenceEndDate,
      },
      {
        session,
      },
    );
  }

  // remove any dangling recurrence rule and base recurring event documents
  await removeDanglingDocuments(
    recurrenceRule._id.toString(),
    baseRecurringEvent._id.toString(),
    session,
  );

  return updatedEvent;
};
