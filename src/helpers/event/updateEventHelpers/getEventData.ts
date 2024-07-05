import type { InterfaceEvent } from "../../../models";
import type { UpdateEventInput } from "../../../types/generatedGraphQLTypes";
import type { InterfaceRecurringEvent } from "../recurringEventHelpers/generateRecurringEventInstances";

/**
 * This function retrieves the data to be used for updating an event,
 * combining existing event data with new input data.
 * @param updateEventInputData - The input data to update the event.
 * @param event - The current event data to be updated.
 * @returns The updated event data.
 */
export const getEventData = (
  updateEventInputData: UpdateEventInput | undefined | null,
  event: InterfaceEvent,
): InterfaceRecurringEvent => {
  // Step 1: Get the current event data.
  const eventCurrentData = {
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    allDay: event.allDay,
    recurring: event.recurring,
    isPublic: event.isPublic,
    isRegisterable: event.isRegisterable,
    admins: event.admins,
    location: event.location,
    latitude: event.latitude,
    longitude: event.longitude,
    creatorId: event.creatorId,
    organizationId: event.organization,
  };

  // Step 2: Update the current data with the input data (if provided).
  const updatedEventData: InterfaceRecurringEvent = {
    ...eventCurrentData,
    ...(updateEventInputData as Partial<InterfaceRecurringEvent>),
  };

  return updatedEventData;
};
