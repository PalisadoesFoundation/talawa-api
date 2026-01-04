import type { InferSelectModel } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import type { usersTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	type EventWithAttachments,
	filterInviteOnlyEvents,
} from "~/src/graphql/types/Query/eventQueries";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type UserType = InferSelectModel<typeof usersTable>;

const usersByIdsInputSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

const eventsByOrganizationIdInputSchema = z.object({
	organizationId: z.string().uuid(),
});

builder.queryField("usersByIds", (t) =>
	t.field({
		type: [User],
		args: {
			input: t.arg({
				type: builder.inputType("UsersByIdsInput", {
					fields: (t) => ({
						ids: t.field({ type: ["ID"], required: true }),
					}),
				}),
				required: true,
			}),
		},
		description: "Fetch multiple users by their IDs.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs = usersByIdsInputSchema.safeParse(args.input);
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

			const userIds = parsedArgs.data.ids;

			const users = await ctx.drizzleClient.query.usersTable.findMany({
				where: (fields, _operators) => inArray(fields.id, userIds),
			});

			return users;
		},
	}),
);

builder.queryField("usersByOrganizationId", (t) =>
	t.field({
		description: "Fetch all users that belong to a given organization.",
		type: [User],
		args: {
			organizationId: t.arg({ type: "ID", required: true }),
		},
		resolve: async (_parent, args, ctx): Promise<UserType[]> => {
			try {
				const userMemberships =
					await ctx.drizzleClient.query.organizationMembershipsTable.findMany({
						where: (fields, operators) =>
							operators.eq(fields.organizationId, args.organizationId),
					});

				const userIds = userMemberships.map(
					(membership) => membership.memberId,
				);

				if (userIds.length === 0) return [];

				const users = await ctx.drizzleClient.query.usersTable.findMany({
					where: (fields, _operators) => inArray(fields.id, userIds),
				});

				return users;
			} catch (error) {
				ctx.log.error(
					{ error, organizationId: args.organizationId },
					"Error fetching users for organization",
				);
				throw new Error("An error occurred while fetching users.");
			}
		},
	}),
);

builder.queryField("eventsByOrganizationId", (t) =>
	t.field({
		description: "Fetch all events that belong to a given organization.",
		type: [Event],
		args: {
			input: t.arg({
				type: builder.inputType("EventsByOrganizationIdInput", {
					fields: (t) => ({
						organizationId: t.id({ required: true }),
					}),
				}),
				required: true,
			}),
		},
		resolve: async (_parent, args, ctx): Promise<EventWithAttachments[]> => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs = eventsByOrganizationIdInputSchema.safeParse(
				args.input,
			);
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
			const currentUserId = ctx.currentClient.user.id;

			// Get current user and organization membership for filtering
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
				},
				with: {
					organizationMembershipsWhereMember: {
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(
								fields.organizationId,
								parsedArgs.data.organizationId,
							),
					},
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const currentUserOrganizationMembership =
				currentUser.organizationMembershipsWhereMember[0];

			try {
				const events = await ctx.drizzleClient.query.eventsTable.findMany({
					with: {
						attachmentsWhereEvent: true,
					},
					where: (fields, operators) =>
						operators.and(
							operators.eq(
								fields.organizationId,
								parsedArgs.data.organizationId,
							),
							operators.eq(fields.isRecurringEventTemplate, false),
						),
				});

				// Transform to EventWithAttachments format
				const eventsWithAttachments: EventWithAttachments[] = events.map(
					(event) => ({
						...event,
						attachments:
							event.attachmentsWhereEvent?.map((attachment) => ({
								...attachment,
							})) || [],
						eventType: "standalone" as const,
					}),
				);

				// Filter invite-only events based on visibility rules
				const filteredEvents = await filterInviteOnlyEvents({
					events: eventsWithAttachments,
					currentUserId,
					currentUserRole: currentUser.role,
					currentUserOrgMembership: currentUserOrganizationMembership,
					drizzleClient: ctx.drizzleClient,
				});

				return filteredEvents;
			} catch (error) {
				ctx.log.error(
					{ error, organizationId: parsedArgs.data.organizationId },
					"Error fetching events for organization",
				);
				throw new Error("An error occurred while fetching events.");
			}
		},
	}),
);
