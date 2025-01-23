import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import {
	venueBookingsTable,
	venueBookingsTableInsertSchema,
} from "~/src/drizzle/tables/venueBookings";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Venue } from "./Venue";

const eventsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursor: z.infer<typeof cursorSchema> | undefined = undefined;

		try {
			if (arg.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (error) {
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [arg.isInversed ? "before" : "after"],
			});
		}

		return {
			cursor,
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

const cursorSchema = venueBookingsTableInsertSchema
	.pick({
		eventId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		eventId: arg.eventId,
	}));

Venue.implement({
	fields: (t) => ({
		events: t.connection(
			{
				description:
					"GraphQL connection to traverse through the events the venue has been booked for.",
				resolve: async (parent, args, ctx) => {
					if (!ctx.currentClient.isAuthenticated) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					const {
						data: parsedArgs,
						error,
						success,
					} = eventsArgumentsSchema.safeParse(args);

					if (!success) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: error.issues.map((issue) => ({
									argumentPath: issue.path,
									message: issue.message,
								})),
							},
						});
					}

					const currentUserId = ctx.currentClient.user.id;

					const currentUser =
						await ctx.drizzleClient.query.usersTable.findFirst({
							columns: {
								role: true,
							},
							with: {
								organizationMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.organizationId, parent.organizationId),
								},
							},
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						});

					if (currentUser === undefined) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					const currentUserOrganizationMembership =
						currentUser.organizationMembershipsWhereMember[0];

					if (
						currentUser.role !== "administrator" &&
						(currentUserOrganizationMembership === undefined ||
							currentUserOrganizationMembership.role !== "administrator")
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [
								asc(venueBookingsTable.createdAt),
								asc(venueBookingsTable.eventId),
							]
						: [
								desc(venueBookingsTable.createdAt),
								desc(venueBookingsTable.eventId),
							];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(venueBookingsTable)
										.where(
											and(
												eq(venueBookingsTable.createdAt, cursor.createdAt),
												eq(venueBookingsTable.eventId, cursor.eventId),
												eq(venueBookingsTable.venueId, parent.id),
											),
										),
								),
								eq(venueBookingsTable.venueId, parent.id),
								or(
									and(
										eq(venueBookingsTable.createdAt, cursor.createdAt),
										gt(venueBookingsTable.eventId, cursor.eventId),
									),
									gt(venueBookingsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(venueBookingsTable.venueId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(venueBookingsTable)
										.where(
											and(
												eq(venueBookingsTable.createdAt, cursor.createdAt),
												eq(venueBookingsTable.eventId, cursor.eventId),
												eq(venueBookingsTable.venueId, parent.id),
											),
										),
								),
								eq(venueBookingsTable.venueId, parent.id),
								or(
									and(
										eq(venueBookingsTable.createdAt, cursor.createdAt),
										lt(venueBookingsTable.eventId, cursor.eventId),
									),
									lt(venueBookingsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(venueBookingsTable.venueId, parent.id);
						}
					}

					const venueBookings =
						await ctx.drizzleClient.query.venueBookingsTable.findMany({
							columns: {
								createdAt: true,
								eventId: true,
							},
							limit,
							orderBy,
							with: {
								event: {
									with: {
										attachmentsWhereEvent: true,
									},
								},
							},
							where,
						});

					if (cursor !== undefined && venueBookings.length === 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: [isInversed ? "before" : "after"],
									},
								],
							},
						});
					}

					return transformToDefaultGraphQLConnection({
						createCursor: (booking) =>
							Buffer.from(
								JSON.stringify({
									createdAt: booking.createdAt.toISOString(),
									eventId: booking.eventId,
								}),
							).toString("base64url"),
						createNode: ({ event: { attachmentsWhereEvent, ...event } }) =>
							Object.assign(event, {
								attachments: attachmentsWhereEvent,
							}),
						parsedArgs,
						rawNodes: venueBookings,
					});
				},
				type: Event,
			},
			{
				description: "",
			},
			{
				description: "",
			},
		),
	}),
});
