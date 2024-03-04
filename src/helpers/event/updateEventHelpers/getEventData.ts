import type { InterfaceEvent } from "../../../models";
import type {
  Recurrance,
  UpdateEventInput,
} from "../../../types/generatedGraphQLTypes";
import type { InterfaceRecurringEvent } from "../recurringEventHelpers/generateRecurringEventInstances";

/**
 * This function get the data to be used for generating the recurring event instances.
 * @param updateEventInputData - the update event input data.
 * @param event - the event to be updated.
 * @remarks The following steps are followed:
 * 1. get the current event data.
 * 2. update the data provided in the input.
 * @returns The updated event data.
 */

export const getEventData = (
  updateEventInputData: UpdateEventInput | undefined | null,
  event: InterfaceEvent,
): InterfaceRecurringEvent => {
  // get the event's current data
  const eventCurrentData = {
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
    admins: event.admins,
    location: event.location,
    latitude: event.latitude,
    longitude: event.longitude,
    creatorId: event.creatorId,
    organizationId: event.organization,
  };

  // get the updated event data
  const updatedEventData: InterfaceRecurringEvent = {
    ...eventCurrentData,
    ...(updateEventInputData as Partial<InterfaceRecurringEvent>),
    recurrance: eventCurrentData.recurrance as Recurrance,
  };

  return updatedEventData;
};
