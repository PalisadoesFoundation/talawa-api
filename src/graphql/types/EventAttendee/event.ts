import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { Event } from "~/src/graphql/types/Event/Event";
import { getRecurringEventInstancesByIds } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventAttendee as EventAttendeeType } from "./EventAttendee";
import { EventAttendee } from "./EventAttendee";

/**
 * Resolves the event that an event attendee is associated with.
 *
 * @param parent - The parent EventAttendee object containing the eventId or recurringEventInstanceId.
 * @param _args - GraphQL arguments (unused).
 * @param ctx - The GraphQL context containing dataloaders and logging utilities.
 * @returns The event the attendee is associated with.
 * @throws TalawaGraphQLError with code "unauthenticated" if user is not authenticated.
 * @throws TalawaGraphQLError with code "unexpected" if event is not found (indicates data corruption).
 */
export const eventAttendeeEventResolver = async (
  parent: EventAttendeeType,
  _args: Record<string, never>,
  ctx: GraphQLContext,
): Promise<EventType | null> => {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
      },
    });
  }

  // Handle standalone events
  if (parent.eventId) {
    const event = await ctx.dataloaders.event.load(parent.eventId);

    if (event === null) {
      ctx.log.warn(
        {
          eventAttendeeId: parent.id,
          eventId: parent.eventId,
        },
        "DataLoader returned null for an event attendee's event id that isn't null.",
      );
      throw new TalawaGraphQLError({
        extensions: {
          code: "unexpected",
        },
      });
    }

    // Return event with empty attachments array to match Event type
    return {
      ...event,
      attachments: [],
    } as EventType;
  }

  // Handle recurring event instances
  if (parent.recurringEventInstanceId) {
    const instances = await getRecurringEventInstancesByIds(
      [parent.recurringEventInstanceId],
      ctx.drizzleClient,
      ctx.log,
    );

    if (instances.length === 0) {
      ctx.log.warn(
        {
          eventAttendeeId: parent.id,
          recurringEventInstanceId: parent.recurringEventInstanceId,
        },
        "Failed to find recurring event instance for event attendee.",
      );
      throw new TalawaGraphQLError({
        extensions: {
          code: "unexpected",
        },
      });
    }

    // instances[0] is defined because we checked length > 0 above
    const resolvedInstance = instances[0] as (typeof instances)[number];

    // Return resolved instance with attachments array to match Event type
    return {
      ...resolvedInstance,
      attachments: resolvedInstance.attachments ?? [],
    } as EventType;
  }

  return null;
};

EventAttendee.implement({
  fields: (t) => ({
    event: t.field({
      description:
        "The event the attendee is associated with. Supports both standalone events and recurring event instances.",
      resolve: eventAttendeeEventResolver,
      type: Event,
      complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
    }),
  }),
});
