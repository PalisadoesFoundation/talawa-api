import { inArray } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByIdsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});
builder.queryField("eventsByIds", (t) =>
	t.field({
		type: [Event],
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("QueryEventsByIdsInput", {
					fields: (t) => ({
						ids: t.field({
							type: ["ID"],
							required: true,
						}),
					}),
				}),
			}),
		},
		description: "Fetch multiple events by their IDs.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs = queryEventsByIdsSchema.safeParse(args.input);
			if (!parsedArgs.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsedArgs.error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const eventIds = parsedArgs.data.ids;
			const currentUserId = ctx.currentClient.user.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const events = await ctx.drizzleClient.query.eventsTable.findMany({
				with: {
					attachmentsWhereEvent: true,
					organization: {
						columns: { countryCode: true },
						with: {
							membershipsWhereOrganization: {
								columns: { role: true },
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
						},
					},
				},
				where: (fields, operators) => inArray(fields.id, eventIds),
			});

			if (events.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "ids"],
							},
						],
					},
				});
			}

			return events.map((event) => ({
				...event,
				attachments: event.attachmentsWhereEvent,
			}));
		},
	}),
);
