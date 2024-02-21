import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, EventAttendee, User } from "../../../models";
import type {
  EventInput,
  MutationCreateEventArgs,
  MutationUpdateEventArgs,
  Recurrance,
} from "../../../types/generatedGraphQLTypes";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import { generateRecurrenceRuleString } from "../recurringEventHelpers";
import { createRecurringEvent } from "../createEventHelpers";

export const updateThisAndFollowingInstances = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  let recurrenceRule = await RecurrenceRule.findOne({
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

  if (args.recurrenceRuleData) {
    newRecurrenceRuleString = generateRecurrenceRuleString(
      args.recurrenceRuleData,
      startDate,
      endDate,
    );
  }

  if (newRecurrenceRuleString !== recurrenceRule.recurrenceRuleString) {
    // if the recurrence rule has changed, delete the currenct recurrence series, and generate a new one
    const recurringEventInstances = await Event.find({
      recurrenceRuleId: event.recurrenceRuleId,
      startDate: { $gte: event.startDate },
    });

    const recurringEventInstancesIds = recurringEventInstances.map(
      (recurringEventInstance) => recurringEventInstance._id,
    );

    // get the current event data
    // const {
    //   _id,
    //   recurrance,
    //   creatorId,
    //   organization: organizationId,
    //   ...eventData
    // } = event;

    const eventData = {
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      recurring: event.recurring,
      recurrance: event.recurrance,
      isPublic: event.isPublic,
      isRegisterable: event.isRegisterable,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      organizationId: event.organization,
    };

    // get the data from the update event input args
    const { data: updateEventInputData, recurrenceRuleData } = args;

    // get the data based on which the baseRecurringEvent and recurring instances would be generated
    // i.e. take the current event data, and the update it based on the update event input
    const updatedEventData: EventInput = {
      ...eventData,
      startDate: event.startDate,
      endDate,
      ...Object.fromEntries(
        Object.entries(updateEventInputData ?? {}).filter(
          ([value]) => value !== null,
        ),
      ),
      recurrance: eventData.recurrance as Recurrance,
    };

    // get the "args" argument for the createRecurringEvent function
    const createRecurringEventArgs: MutationCreateEventArgs = {
      data: updatedEventData,
      recurrenceRuleData,
    };

    updatedEvent = await createRecurringEvent(
      createRecurringEventArgs,
      event.creatorId,
      event.organization,
      session,
      baseRecurringEvent._id,
    );

    await Event.deleteMany({
      _id: { $in: recurringEventInstancesIds },
    });

    await EventAttendee.deleteMany({
      eventId: { $in: recurringEventInstancesIds },
    });

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

    const eventsFollowingCurrentRecurrence = await Event.find({
      recurrenceRuleId: recurrenceRule._id,
    }).sort({ startDate: -1 });

    const updatedLatestRecurringInstanceDate = new Date(
      eventsFollowingCurrentRecurrence[0].startDate,
    );

    recurrenceRule = await RecurrenceRule.findOneAndUpdate(
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
    // perform bulk update on the events following the current event's recurrence rule
    await Event.updateMany(
      {
        recurrenceRuleId: event.recurrenceRuleId,
        startDate: { $gte: event.startDate },
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
    ((recurrenceRule.endDate === null && baseRecurringEvent.endDate === null) ||
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
