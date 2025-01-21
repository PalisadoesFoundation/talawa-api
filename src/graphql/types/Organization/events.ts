import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import {
	eventsTable,
	eventsTableInsertSchema,
} from "~/src/drizzle/tables/events";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "./Organization";

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

const cursorSchema = z
	.object({
		id: eventsTableInsertSchema.shape.id.unwrap(),
		startAt: z.string().datetime(),
	})
	.transform((arg) => ({
		id: arg.id,
		startAt: new Date(arg.startAt),
	}));

Organization.implement({
	fields: (t) => ({
		events: t.connection(
			{
				description:
					"GraphQL connection to traverse through the events belonging to the organization.",
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
										operators.eq(fields.organizationId, parent.id),
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
						currentUserOrganizationMembership === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(eventsTable.startAt), desc(eventsTable.id)]
						: [asc(eventsTable.startAt), asc(eventsTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(eventsTable)
										.where(
											and(
												eq(eventsTable.id, cursor.id),
												eq(eventsTable.organizationId, parent.id),
												eq(eventsTable.startAt, cursor.startAt),
											),
										),
								),
								eq(eventsTable.organizationId, parent.id),
								or(
									and(
										eq(eventsTable.startAt, cursor.startAt),
										lt(eventsTable.id, cursor.id),
									),
									lt(eventsTable.startAt, cursor.startAt),
								),
							);
						} else {
							where = eq(eventsTable.organizationId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(eventsTable)
										.where(
											and(
												eq(eventsTable.id, cursor.id),
												eq(eventsTable.organizationId, parent.id),
												eq(eventsTable.startAt, cursor.startAt),
											),
										),
								),
								eq(eventsTable.organizationId, parent.id),
								or(
									and(
										eq(eventsTable.startAt, cursor.startAt),
										gt(eventsTable.id, cursor.id),
									),
									gt(eventsTable.startAt, cursor.startAt),
								),
							);
						} else {
							where = eq(eventsTable.organizationId, parent.id);
						}
					}

					const events = await ctx.drizzleClient.query.eventsTable.findMany({
						limit,
						orderBy,
						with: {
							attachmentsWhereEvent: true,
						},
						where,
					});

					if (cursor !== undefined && events.length === 0) {
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
						createCursor: (event) =>
							Buffer.from(
								JSON.stringify({
									id: event.id,
									startAt: event.startAt.toISOString(),
								}),
							).toString("base64url"),
						createNode: ({ attachmentsWhereEvent, ...event }) =>
							Object.assign(event, {
								attachments: attachmentsWhereEvent,
							}),
						parsedArgs,
						rawNodes: events,
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
