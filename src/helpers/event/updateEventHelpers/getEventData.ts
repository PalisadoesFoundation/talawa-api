import type { InterfaceEvent } from "../../../models";
import type {
  Recurrance,
  UpdateEventInput,
} from "../../../types/generatedGraphQLTypes";
import type { InterfaceRecurringEvent } from "../recurringEventHelpers/generateRecurringEventInstances";

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
    recurrance: eventCurrentData.recurrance as Recurrance,
    ...Object.fromEntries(
      Object.entries(updateEventInputData ?? {}).filter(
        ([value]) => value !== null,
      ),
    ),
  };

  return updatedEventData;
};
