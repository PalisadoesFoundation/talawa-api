import { count, eq } from "drizzle-orm";
import { builder } from "~/src/graphql/builder";
import { eventAttendancesTable } from "~/src/drizzle/tables/eventAttendances";
import { eventsTable } from "~/src/drizzle/tables/events";
import { z } from "zod";

// Zod schema for argument validation
const mutationRegisterForEventArgumentsSchema = z.object({
    input: z.object({
        eventId: z.string().uuid(),
    }),
});

// Export the input type object for use in t.arg
export const RegisterForEventInput = builder.inputType("RegisterForEventInput", {
    fields: (t) => ({
        eventId: t.string({ required: true }),
    }),
});

builder.mutationField("registerForEvent", (t) =>
    t.field({
        type: "Boolean",
        args: {
            input: t.arg({ type: RegisterForEventInput }),
        },
        description: "Register the current user for an event, enforcing capacity.",
        resolve: async (_root, args, ctx) => {
            const { input } = mutationRegisterForEventArgumentsSchema.parse(args);

            // Type guard for authenticated user
            if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user) {
                throw new Error("User not authenticated");
            }

            const userId: string = ctx.currentClient.user.id;

            // Transaction for atomic seat check and registration
            return await ctx.drizzleClient.transaction(async (tx) => {
                // Lock the event row for update
                const [event] = await tx
                    .select({
                        id: eventsTable.id,
                        capacity: eventsTable.maxCapacity, // Use the correct column name as defined in your eventsTable schema.
                        createdAt: eventsTable.createdAt,
                        creatorId: eventsTable.creatorId,
                        description: eventsTable.description,
                        endAt: eventsTable.endAt,
                        name: eventsTable.name,
                        organizationId: eventsTable.organizationId,
                        startAt: eventsTable.startAt,
                        allDay: eventsTable.allDay,
                        isPublic: eventsTable.isPublic,
                        isRecurringEventTemplate: eventsTable.isRecurringEventTemplate,
                        // add other fields as needed
                    })
                    .from(eventsTable)
                    .where(eq(eventsTable.id, input.eventId))
                    .for("update")
                    .limit(1);

                if (!event) {
                    throw new Error("Event not found");
                }

                // Count current registrations
                const registrationResult = await tx
                    .select({ count: count() })
                    .from(eventAttendancesTable)
                    .where(eq(eventAttendancesTable.eventId, input.eventId));

                const registrationCount = registrationResult?.[0]?.count ?? 0;

                if (event.capacity != null && registrationCount >= event.capacity) {
                    throw new Error("Event is full");
                }

                // Register the user
                await tx.insert(eventAttendancesTable).values({
                    eventId: input.eventId,
                    attendeeId: userId,
                });

                return true;
            });
        },
    }),
);