import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import {
	venueBookingsTable,
	venueBookingsTableInsertSchema,
} from "~/src/drizzle/tables/venueBookings";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Event } from "./Event";

const venuesArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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
		venueId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		venueId: arg.venueId,
	}));

Event.implement({
	fields: (t) => ({
		venues: t.connection(
			{
				description:
					"GraphQL connection to traverse through the venues that are booked for the event.",
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = venuesArgumentsSchema.safeParse(args);

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

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [
								asc(venueBookingsTable.createdAt),
								asc(venueBookingsTable.venueId),
							]
						: [
								desc(venueBookingsTable.createdAt),
								desc(venueBookingsTable.venueId),
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
												eq(venueBookingsTable.eventId, parent.id),
												eq(venueBookingsTable.venueId, cursor.venueId),
											),
										),
								),
								eq(venueBookingsTable.eventId, parent.id),
								or(
									and(
										eq(venueBookingsTable.createdAt, cursor.createdAt),
										gt(venueBookingsTable.venueId, cursor.venueId),
									),
									gt(venueBookingsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(venueBookingsTable.eventId, parent.id);
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
												eq(venueBookingsTable.eventId, parent.id),
												eq(venueBookingsTable.venueId, cursor.venueId),
											),
										),
								),
								eq(venueBookingsTable.eventId, parent.id),
								or(
									and(
										eq(venueBookingsTable.createdAt, cursor.createdAt),
										lt(venueBookingsTable.venueId, cursor.venueId),
									),
									lt(venueBookingsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(venueBookingsTable.eventId, parent.id);
						}
					}

					const venueBookings =
						await ctx.drizzleClient.query.venueBookingsTable.findMany({
							columns: {
								createdAt: true,
								venueId: true,
							},
							limit,
							orderBy,
							where,
							with: {
								venue: {
									with: {
										attachmentsWhereVenue: true,
									},
								},
							},
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
									createdAt: booking.createdAt,
									venueId: booking.venueId,
								}),
							).toString("base64url"),
						createNode: ({ venue: { attachmentsWhereVenue, ...venue } }) =>
							Object.assign(venue, {
								attachments: attachmentsWhereVenue,
							}),
						parsedArgs,
						rawNodes: venueBookings,
					});
				},
				type: Venue,
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
