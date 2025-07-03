import z from "zod";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryNotificationInput,
	queryNotificationInputSchema,
} from "~/src/graphql/inputs/QueryNotificationInput";
import { User } from "../User/User";
import { Notification } from "~/src/graphql/types/Notification/NotificationResponse";
import { notificationLogsTable } from "~/src/drizzle/tables/NotificationLog";
import { notificationAudienceTable } from "~/src/drizzle/tables/NotificationAudience";
import { eq, and, desc, or, inArray } from "drizzle-orm";

const queryNotificationArgumentsSchema = z.object({
	input: queryNotificationInputSchema,
});

User.implement({
	fields: (t) => ({
		notifications: t.field({
			type: [Notification],
			description: "Notifications for this user",
			args: {
				input: t.arg({
					type: QueryNotificationInput,
					description: "Input for querying notifications",
				}),
			},
			resolve: async (parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const {
					success,
					error,
					data: parsedArgs,
				} = queryNotificationArgumentsSchema.safeParse(args);
				if (!success) {
					throw new TalawaGraphQLError({
						message: "Invalid arguments for notifications query",
						extensions: {
							code: "invalid_arguments",
							issues: error.issues.map((issue) => ({
								argumentPath: issue.path,
								message: issue.message,
							})),
						},
					});
				}
				const currentUserid = ctx.currentClient.user.id;
				if (parent.id !== currentUserid) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}
				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserid),
				});
				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}
				const userOrgs =
					await ctx.drizzleClient.query.organizationMembershipsTable.findMany({
						columns: { organizationId: true },
						where: (fields, operators) =>
							operators.eq(fields.memberId, currentUserid),
					});
				const orgIds = userOrgs.map((org) => org.organizationId);

				const rawNotifications = await ctx.drizzleClient
					.select({
						id: notificationLogsTable.id,
						navigation: notificationLogsTable.navigation,
						renderedContent: notificationLogsTable.renderedContent,
						createdAt: notificationLogsTable.createdAt,
						eventType: notificationLogsTable.eventType,
						isRead: notificationAudienceTable.isRead,
						readAt: notificationAudienceTable.readAt,
					})
					.from(notificationLogsTable)
					.innerJoin(
						notificationAudienceTable,
						eq(
							notificationAudienceTable.notificationId,
							notificationLogsTable.id,
						),
					)
					.where(
						and(
							or(
								and(
									eq(notificationAudienceTable.targetType, "user"),
									eq(notificationAudienceTable.targetId, parent.id),
								),
								and(
									eq(notificationAudienceTable.targetType, "organization"),
									inArray(notificationAudienceTable.targetId, orgIds),
								),
							),
							eq(notificationLogsTable.channel, "in_app"),
						),
					)
					.orderBy(desc(notificationLogsTable.createdAt))
					.limit(parsedArgs.input.first || 20)
					.offset(parsedArgs.input.skip || 0);

				console.log("Raw Notifications:", rawNotifications);
				return rawNotifications.map((notification) => ({
					id: notification.id,
					isRead: notification.isRead,
					readAt: notification.readAt,
					navigation: notification.navigation,
					createdAt: notification.createdAt,
					eventType: notification.eventType,
					renderedContent: {
						title:
							((notification.renderedContent as Record<string, unknown>)
								?.title as string) || "",
						body:
							((notification.renderedContent as Record<string, unknown>)
								?.body as string) || "",
						...(typeof notification.renderedContent === "object" &&
						notification.renderedContent !== null
							? (notification.renderedContent as Record<string, unknown>)
							: {}),
					},
				}));
			},
		}),
	}),
});
