import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { notificationAudienceTable } from "~/src/drizzle/tables/NotificationAudience";
import { builder } from "~/src/graphql/builder";
import {
	MutationReadNotificationInput,
	mutationReadNotificationInputSchema,
} from "~/src/graphql/inputs/MutationReadNotificationinput";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ReadNotificationResponse } from "../Notification/ReadNotificationResponse";

const MutationReadNotificationArgumentSchema = z.object({
	input: mutationReadNotificationInputSchema,
});

builder.mutationField("readNotification", (t) =>
	t.field({
		type: ReadNotificationResponse,
		args: {
			input: t.arg({
				type: MutationReadNotificationInput,
				required: true,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
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
			} = MutationReadNotificationArgumentSchema.safeParse(args);

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

			const currentUserid = ctx.currentClient.user.id;
			const notificationIds = Array.isArray(parsedArgs.input.notificationIds)
				? parsedArgs.input.notificationIds
				: [parsedArgs.input.notificationIds];
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
					name: true,
				},
				where: (table, { eq }) => eq(table.id, currentUserid),
			});
			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}
			if (notificationIds.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "notificationIds"],
								message: "Notification IDs cannot be empty.",
							},
						],
					},
				});
			}
			let updateResult: unknown;
			try {
				updateResult = await ctx.drizzleClient
					.update(notificationAudienceTable)
					.set({ isRead: true, readAt: new Date() })
					.where(
						and(
							inArray(
								notificationAudienceTable.notificationId,
								notificationIds,
							),
							eq(notificationAudienceTable.userId, currentUserid),
						),
					);
			} catch (_error) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}
			if (updateResult === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}
			return {
				success: true,
				message: `Marked ${notificationIds.length} notification(s) as read.`,
			};
		},
	}),
);
