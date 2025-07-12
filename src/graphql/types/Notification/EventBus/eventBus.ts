import { EventEmitter } from "node:events";
import type { GraphQLContext } from "~/src/graphql/context";
import {
	NotificationChannelType,
	NotificationEngine,
	NotificationTargetType,
} from "../Notification_engine";

class NotificationEventBus extends EventEmitter {
	async emitPostCreated(
		data: {
			postId: string;
			organizationId: string;
			authorName: string;
			organizationName: string;
			postCaption: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("post.created", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"post_created",
					{
						authorName: data.authorName,
						organizationName: data.organizationName,
						postCaption: data.postCaption,
						postId: data.postId,
						postUrl: `/post/${data.postId}`,
					},
					{
						targetType: NotificationTargetType.ORGANIZATION,
						targetIds: [data.organizationId],
					},
					NotificationChannelType.IN_APP,
				);

				ctx.log.info(`Notification sent for post ${data.postId}`);
			} catch (error) {
				ctx.log.error("Failed to send post notification:", error);
			}
		});
	}

	async emitMembershipRequestAccepted(
		data: {
			userId: string;
			organizationId: string;
			organizationName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("membership_request.accepted", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"membership_request_accepted",
					{
						organizationName: data.organizationName,
						organizationId: data.organizationId,
					},
					{
						targetType: NotificationTargetType.USER,
						targetIds: [data.userId],
					},
					NotificationChannelType.IN_APP,
				);
				ctx.log.info(
					`Membership acceptance notification sent to user ${data.userId}`,
				);
			} catch (error) {
				ctx.log.error(
					"Failed to send membership acceptance notification:",
					error,
				);
			}
		});
	}
}

export const notificationEventBus = new NotificationEventBus();
