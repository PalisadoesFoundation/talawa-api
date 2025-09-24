// @ts-nocheck
import { builder } from "~/src/graphql/builder";
import { eventAttendancesTable } from "~/src/drizzle/tables/eventAttendances";
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
            return await ctx.drizzleClient.transaction(async (tx: any) => {
                // Lock the event row for update
                const event = await tx.query.eventsTable.findFirst({
                    where: (fields: { id: string }, operators: { eq: (a: any, b: any) => boolean }) =>
                        operators.eq(fields.id, input.eventId),
                    lock: { mode: "update" },
                });
                if (!event) throw new Error("Event not found");
                // Count current registrations
                const count = await tx.query.eventAttendancesTable.count({
                    where: (fields: { eventId: string }, operators: { eq: (a: any, b: any) => boolean }) =>
                        operators.eq(fields.eventId, input.eventId),
                });
                if (event.capacity != null && count >= event.capacity) {
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
    })
);
