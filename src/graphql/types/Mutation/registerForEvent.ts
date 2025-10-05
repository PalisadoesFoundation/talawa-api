import { and, eq, sql } from "drizzle-orm";
import { eventAttendancesTable } from "../../../drizzle/tables/eventAttendances";
import { TalawaGraphQLError } from "../../../utilities/TalawaGraphQLError";
// import { eventsTable } from "../../../drizzle/tables/events"; // removed unused import
// import { z } from "zod";
import { builder } from "../../builder";
import { EventAttendance } from "../EventAttendance/EventAttendance";

const RegisterForEventInput = builder.inputType("RegisterForEventInput", {
	fields: (t) => ({
		eventId: t.string({
			required: true,
			description: "ID of the event to register for",
		}),
	}),
});

builder.mutationField("registerForEvent", (t) =>
	t.field({
		type: EventAttendance,
		args: {
			input: t.arg({ type: RegisterForEventInput, required: true }),
		},
		description: "Register the current user for an event, enforcing capacity.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}
			const userId = ctx.currentClient.user.id;
			const eventId = args.input?.eventId;
			if (!eventId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						message: "Missing eventId",
						issues: [{ argumentPath: ["eventId"], message: "Missing eventId" }],
					},
				});
			}
			return await ctx.drizzleClient.transaction(async (tx) => {
				// Lock the event row for update to prevent race conditions
				const [eventRaw] = await tx.execute(
					sql`SELECT * FROM events WHERE id = ${eventId} FOR UPDATE`,
				);
				const event = eventRaw as
					| { isRegisterable: boolean; capacity: number }
					| undefined;
				if (!event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["eventId"] }],
							message: "Event not found",
						},
					});
				}
				if (!event.isRegisterable) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action",
							message: "Event is not open for registration",
						},
					});
				}
				// Count current attendances
				const countResult = await tx.execute(
					sql`SELECT COUNT(*)::int AS count FROM event_attendances WHERE event_id = ${eventId}`,
				);
				const rawCount =
					Array.isArray(countResult) &&
					countResult.length > 0 &&
					typeof countResult[0]?.count !== "undefined"
						? countResult[0].count
						: 0;
				const count = Number(rawCount);
				if (count >= Number(event.capacity)) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action",
							message: "Event is full. No seats available.",
						},
					});
				}
				// Check if user already registered
				const [existing] = await tx
					.select()
					.from(eventAttendancesTable)
					.where(
						and(
							eq(eventAttendancesTable.eventId, eventId),
							eq(eventAttendancesTable.attendeeId, userId),
						),
					);
				if (existing) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action",
							message: "User already registered for this event",
						},
					});
				}
				// Register user
				const [attendance] = await tx
					.insert(eventAttendancesTable)
					.values({ eventId, attendeeId: userId, creatorId: userId })
					.returning();
				return attendance ?? null;
			});
		},
	}),
);
