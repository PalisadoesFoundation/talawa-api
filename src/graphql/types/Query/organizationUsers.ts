import { inArray } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import type { usersTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type UserType = InferSelectModel<typeof usersTable>;

const usersByIdsInputSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

interface EventType {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date | null;
	creatorId: string | null;
	updaterId: string | null;
	startAt: Date;
	endAt: Date;
	organizationId: string;
	allDay: boolean;
	isPublic: boolean;
	isRegisterable: boolean;
	location: string | null;
	isRecurringEventTemplate: boolean;
	capacity: number | null;
	attachments: Array<{
		name: string;
		createdAt: Date;
		creatorId: string | null;
		updatedAt: Date | null;
		updaterId: string | null;
		eventId: string;
		mimeType:
		| "image/avif"
		| "image/jpeg"
		| "image/png"
		| "image/webp"
		| "video/mp4"
		| "video/webm";
	}>;
}

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
				where: (fields, operators) => inArray(fields.id, userIds),
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
					where: (fields, operators) => inArray(fields.id, userIds),
				});

				return users;
			} catch (error) {
				console.error("Error fetching users for organization:", error);
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
		resolve: async (_parent, args, ctx): Promise<EventType[]> => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}
			console.log("Input args:", args.input);

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
			console.log("Drizzle Client:", !!ctx.drizzleClient);
			console.log("Events Table Query:", !!ctx.drizzleClient.query.eventsTable);
			try {
				const events = await ctx.drizzleClient.query.eventsTable.findMany({
					with: {
						attachmentsWhereEvent: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.organizationId, parsedArgs.data.organizationId),
				});

				console.log("Found events:", events);

				return events.map((event) => ({
					...event,
					capacity: event.capacity ?? null,
					attachments:
						event.attachmentsWhereEvent?.map((attachment) => ({
							...attachment,
						})) || [],
				})) as EventType[];
			} catch (error) {
				console.error("Error fetching events for organization:", error);
				throw new Error("An error occurred while fetching events.");
			}
		},
	}),
);
