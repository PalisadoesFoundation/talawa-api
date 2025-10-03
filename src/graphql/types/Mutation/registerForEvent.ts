import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendancesTable } from "~/src/drizzle/tables/eventAttendances";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

const mutationRegisterForEventArgumentsSchema = z.object({
    input: z.object({
        eventId: z.string().uuid(),
    }),
});

export const RegisterForEventInput = builder.inputType(
    "RegisterForEventInput",
    {
        fields: (t) => ({
            eventId: t.string({ required: true }),
        }),
    },
);

builder.mutationField("registerForEvent", (t) =>
    t.field({
        type: "Boolean",
        args: {
            input: t.arg({ type: RegisterForEventInput, required: true }),
        },
        description: "Register the current user for an event, enforcing capacity.",
        resolve: async (_root, args, ctx) => {
            const { input } = mutationRegisterForEventArgumentsSchema.parse(args);

            // Check authentication
            if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user) {
                throw new Error("User not authenticated");
            }

            const userId: string = ctx.currentClient.user.id;

            // Atomic seat check + registration
            return await ctx.drizzleClient.transaction(async (tx) => {
                const [event] = await tx
                    .select({
                        id: eventsTable.id,
                        isRegisterable: eventsTable.isRegisterable,
                    })
                    .from(eventsTable)
                    .where(eq(eventsTable.id, input.eventId))
                    .for("update")
                    .limit(1);

                if (!event) {
                    throw new Error("Event not found");
                }
                if (!event.isRegisterable) {
                    throw new Error("Event is not open for registration");
                }

                const [existing] = await tx
                    .select()
                    .from(eventAttendancesTable)
                    .where(
                        and(
                            eq(eventAttendancesTable.attendeeId, userId),
                            eq(eventAttendancesTable.eventId, input.eventId),
                        ),
                    )
                    .limit(1);

                if (existing) {
                    throw new Error("User is already registered for this event");
                }

                await tx.insert(eventAttendancesTable).values({
                    eventId: input.eventId,
                    attendeeId: userId,
                });

                return true;
            });
        },
    }),
);