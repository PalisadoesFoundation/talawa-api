import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import type {
  EventInput,
  MutationCreateEventArgs,
  MutationUpdateEventArgs,
  Recurrance,
} from "../../../types/generatedGraphQLTypes";
import { createRecurringEvent } from "../createEventHelpers";

/**
 * This function generates a single non-recurring event.
 * @param args - the arguments provided for the updateEvent mutation.
 * @param event - the single event to be updated.
 * @remarks The following steps are followed:
 * 1. If the single event is made recurring with this update:
 *   - get the appropriate data to create the baseRecurringEvent and recurring event instances.
 *   - generate the instances with createRecurringEvent function.
 *   - update the current event to be part of the recurrence by adding the baseRecurringEventId to it.
 * 2. If it's still a non-recurring event:
 *   - just perform a regular update.
 * @returns The created event.
 */

export const updateSingleEvent = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  if (args.data?.recurring) {
    // if the single event is made recurring

    // get the current event data
    const {
      _id: eventId,
      recurrance,
      creatorId,
      organization: organizationId,
      ...eventData
    } = event;

    // get the data from the update event input args
    const { data: updateEventInputData, recurrenceRuleData } = args;

    // get the data based on which the baseRecurringEvent and recurring instances would be generated
    // i.e. take the current event data, and the update it based on the update event input
    const updatedEventData: EventInput = {
      ...eventData,
      ...Object.fromEntries(
        Object.entries(updateEventInputData).filter(
          ([value]) => value !== null,
        ),
      ),
      recurrance: recurrance as Recurrance,
      organizationId,
    };

    // get the "args" argument for the createRecurringEvent function
    const createRecurringEventArgs: MutationCreateEventArgs = {
      data: updatedEventData,
      recurrenceRuleData,
    };

    // convert the single event into a recurring event
    updatedEvent = await createRecurringEvent(
      createRecurringEventArgs,
      creatorId,
      organizationId,
      session,
      null,
      true,
    );

    // add the baseRecurringEventId to the current event to make it a part of the recurrence
    await Event.updateOne(
      {
        _id: eventId,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
        recurrenceRuleId: updatedEvent.recurrenceRuleId,
        baseRecurringEventId: updatedEvent.baseRecurringEventId,
      },
      { session },
    );
  } else {
    // else (i.e. the event is still non-recurring), just perform a regular update
    updatedEvent = await Event.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        new: true,
        session,
      },
    ).lean();

    if (updatedEvent !== null) {
      await cacheEvents([updatedEvent]);
    }
  }

  return updatedEvent;
};
