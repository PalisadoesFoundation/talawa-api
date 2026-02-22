import { and, desc, eq } from "drizzle-orm";
import z from "zod";
import { notificationAudienceTable } from "~/src/drizzle/tables/NotificationAudience";
import { notificationLogsTable } from "~/src/drizzle/tables/NotificationLog";
import {
	QueryNotificationInput,
	queryNotificationInputSchema,
} from "~/src/graphql/inputs/QueryNotificationInput";
import { Notification } from "~/src/graphql/types/Notification/NotificationResponse";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "../User/User";

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
							eq(notificationAudienceTable.userId, currentUserid),
							eq(notificationLogsTable.channel, "in_app"),
						),
					)
					.orderBy(desc(notificationLogsTable.createdAt))
					.limit(parsedArgs.input.first ?? 20)
					.offset(parsedArgs.input.skip || 0);

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
