import { eventAttendancesTable } from "~/src/drizzle/tables/eventAttendances";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
export const registerForEvent = builder.mutationField("registerForEvent", (t) =>
	t.field({
		args: {
			eventId: t.arg({ type: "String", required: true }),
		},
		description: "Register the current user for an event, enforcing capacity.",
		resolve: async (
			_parent: unknown,
			args: { eventId: string },
			ctx: GraphQLContext,
		) => {
			if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}
			const userId = ctx.currentClient.user.id;
			const eventId = args.eventId;
			// Transaction for atomicity
			return await ctx.drizzleClient.transaction(async (tx) => {
				// Lock the event row for update
				const event = await tx.query.eventsTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, eventId),
				});
				if (!event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["eventId"] }],
						},
					});
				}
				// Count current attendees
				const attendeeCount = await tx.query.eventAttendancesTable.findMany({
					where: (fields, operators) => operators.eq(fields.eventId, eventId),
				});
				const attendeeTotal = attendeeCount.length;
				if (attendeeTotal >= event.capacity) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action",
							issues: [{ argumentPath: ["eventId"], message: "Event is full" }],
						},
					});
				}
				// Register the user
				await tx.insert(eventAttendancesTable).values({
					eventId,
					attendeeId: userId,
					creatorId: userId,
				});
				return true;
			});
		},
		type: "Boolean",
	}),
);
