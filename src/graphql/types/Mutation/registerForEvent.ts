import { z } from "zod";

import { builder } from "~/src/graphql/builder";
import { eventAttendancesTable } from "~/src/drizzle/tables/eventAttendances";

const mutationRegisterForEventArgumentsSchema = z.object({
    input: z.object({
        eventId: z.string().uuid(),
    }),
});

builder.mutationField("registerForEvent", (t) =>
    t.field({
        type: "Boolean",
        args: {
            input: t.arg({ type: "RegisterForEventInput" }),
        },
        description: "Register the current user for an event, enforcing capacity.",
        resolve: async (_root: any, args: any, ctx: any) => {
            const { input } = mutationRegisterForEventArgumentsSchema.parse(args);
            if (!ctx.currentClient?.user?.id) {
                throw new GraphQLError("Authentication required", {
                    extensions: {
                        code: "UNAUTHENTICATED",
                    },
                });
            }
            const userId = ctx.currentClient.user.id;
            // Transaction for atomic seat check and registration
            return await ctx.drizzleClient.transaction(async (tx: any) => {
                // Lock the event row for update
                const event = await tx.query.eventsTable.findFirst({
                    where: (fields: any, operators: any) =>
                        operators.eq(fields.id, input.eventId),
                    lock: { mode: "update" },
                });
                if (!event) throw new Error("Event not found");
                // Count current registrations
                const count = await tx.query.eventAttendancesTable.count({
                    where: (fields: any, operators: any) =>
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

// Input type for GraphQL
builder.inputType("RegisterForEventInput", {
    fields: (t) => ({
        eventId: t.string({ required: true }),
    }),
});
