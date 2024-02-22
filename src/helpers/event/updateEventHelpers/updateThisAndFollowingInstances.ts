import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, EventAttendee, User } from "../../../models";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import {
  createRecurrenceRule,
  generateRecurrenceRuleString,
  generateRecurringEventInstances,
  getRecurringInstanceDates,
} from "../recurringEventHelpers";
import { getEventData } from "./getEventData";

export const updateThisAndFollowingInstances = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  const recurrenceRule = await RecurrenceRule.findOne({
    _id: event.recurrenceRuleId,
  });

  const baseRecurringEvent = await Event.findOne({
    _id: event.baseRecurringEventId,
  });

  if (!recurrenceRule || !baseRecurringEvent) {
    return event;
  }

  let newRecurrenceRuleString = recurrenceRule.recurrenceRuleString;

  const startDate = args.data?.startDate || recurrenceRule.startDate;
  const endDate = args.data?.endDate || recurrenceRule.endDate;

  const { data: updateEventInputData, recurrenceRuleData } = args;
  if (recurrenceRuleData) {
    newRecurrenceRuleString = generateRecurrenceRuleString(
      recurrenceRuleData,
      startDate,
      endDate,
    );
  }

  if (newRecurrenceRuleString !== recurrenceRule.recurrenceRuleString) {
    // if the recurrence rule has changed, delete the currenct recurrence series, and generate a new one
    // get latest eventData to be used for baseRecurringEvent and recurring instances
    const eventData = getEventData(updateEventInputData, event);

    // get the recurrence startDate, if provided, else, use event startDate
    const eventStartDate = new Date(eventData.startDate);

    // get recurrence dates
    const recurringInstanceDates = getRecurringInstanceDates(
      newRecurrenceRuleString,
      eventStartDate,
      endDate,
    );

    // get the startDate of the latest instance following the recurrence
    const latestInstanceDate =
      recurringInstanceDates[recurringInstanceDates.length - 1];

    // create the recurrencerule
    const newRecurrenceRule = await createRecurrenceRule(
      newRecurrenceRuleString,
      eventStartDate,
      endDate,
      eventData.organizationId,
      baseRecurringEvent._id,
      latestInstanceDate,
      session,
    );

    // generate the recurring instances and get an instance back
    updatedEvent = await generateRecurringEventInstances({
      data: eventData,
      baseRecurringEventId: baseRecurringEvent._id,
      recurrenceRuleId: newRecurrenceRule?._id.toString(),
      recurringInstanceDates,
      creatorId: event.creatorId,
      organizationId: eventData.organizationId,
      session,
    });

    // remove the events conforming to the current recurrence rule and their associations
    const recurringEventInstances = await Event.find({
      recurrenceRuleId: event.recurrenceRuleId,
      startDate: { $gte: event.startDate },
      isRecurringEventException: false,
    });
    const recurringEventInstancesIds = recurringEventInstances.map(
      (recurringEventInstance) => recurringEventInstance._id,
    );

    await Event.deleteMany(
      {
        _id: { $in: recurringEventInstancesIds },
      },
      { session },
    );
    await EventAttendee.deleteMany(
      {
        eventId: { $in: recurringEventInstancesIds },
      },
      { session },
    );
    await User.updateMany(
      {
        eventAdmin: { $in: recurringEventInstancesIds },
      },
      {
        $pull: {
          eventAdmin: { $in: recurringEventInstancesIds },
          createdEvents: { $in: recurringEventInstancesIds },
          registeredEvents: { $in: recurringEventInstancesIds },
        },
      },
      { session },
    );

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
      const updatedLatestRecurringInstanceDate = new Date(
        eventsFollowingCurrentRecurrence[0].startDate,
      );

      // update the current recurrence rule
      await RecurrenceRule.findOneAndUpdate(
        {
          _id: recurrenceRule._id,
        },
        {
          latestInstanceDate: updatedLatestRecurringInstanceDate,
          endDate: updatedLatestRecurringInstanceDate,
        },
        { session },
      ).lean();
    } else {
      // delete the recurrenceRule
      await RecurrenceRule.deleteOne(
        {
          _id: recurrenceRule._id,
        },
        { session },
      );
    }
  } else {
    // perform bulk update on the events following the current event's recurrence rule
    await Event.updateMany(
      {
        recurrenceRuleId: event.recurrenceRuleId,
        startDate: { $gte: event.startDate },
        isRecurringEventException: false,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        session,
      },
    );

    updatedEvent = await Event.findOne({
      _id: event._id,
    }).lean();
  }

  // update the baseRecurringEvent if it is the latest recurrence rule that the instances are following
  if (
    recurrenceRule &&
    ((!recurrenceRule.endDate && !baseRecurringEvent.endDate) ||
      (recurrenceRule.endDate &&
        baseRecurringEvent.endDate &&
        recurrenceRule.endDate.toString() ===
          baseRecurringEvent.endDate.toString()))
  ) {
    await Event.updateOne(
      {
        _id: event.baseRecurringEventId,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        session,
      },
    );
  }

  return updatedEvent;
};
