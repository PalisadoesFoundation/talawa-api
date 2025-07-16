import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryEventInput,
	queryEventInputSchema,
} from "~/src/graphql/inputs/QueryEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { getEventsByIds } from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const queryEventArgumentsSchema = z.object({
	input: queryEventInputSchema,
});

builder.queryField("event", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for querying a single event by ID",
				required: true,
				type: QueryEventInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query field to read a single event by ID. Supports both standalone events and materialized recurring instances.",
		resolve: async (_parent, args, ctx) => {
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
			} = queryEventArgumentsSchema.safeParse(args);

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
			const eventId = parsedArgs.input.id;

			// Use the unified getEventsByIds function to fetch the event
			const events = await getEventsByIds(
				[eventId],
				ctx.drizzleClient,
				ctx.log,
			);

			const event = events[0];

			if (!event) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// Perform authorization check
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const membership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.organizationId, event.organizationId),
							operators.eq(fields.memberId, currentUserId),
						),
				});

			if (currentUser.role !== "administrator" && !membership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return event;
		},
		type: Event,
	}),
);
