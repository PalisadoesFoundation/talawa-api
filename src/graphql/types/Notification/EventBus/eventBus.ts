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

	async emitEventCreated(
		data: {
			eventId: string;
			eventName: string;
			organizationId: string;
			organizationName: string;
			startDate: string;
			creatorName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("event.created", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"event_created",
					{
						eventName: data.eventName,
						organizationName: data.organizationName,
						startDate: data.startDate,
						eventId: data.eventId,
						creatorName: data.creatorName,
					},
					{
						targetType: NotificationTargetType.ORGANIZATION,
						targetIds: [data.organizationId],
					},
					NotificationChannelType.IN_APP,
				);

				ctx.log.info(
					`Event creation notification sent for event ${data.eventId}`,
				);
			} catch (error) {
				ctx.log.error("Failed to send event creation notification:", error);
			}
		});
	}

	async emitJoinRequestSubmitted(
		data: {
			requestId: string;
			userId: string;
			userName: string;
			organizationId: string;
			organizationName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("join_request.submitted", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"join_request_submitted",
					{
						userName: data.userName,
						organizationName: data.organizationName,
						organizationId: data.organizationId,
						requestId: data.requestId,
					},
					{
						targetType: NotificationTargetType.ORGANIZATION_ADMIN,
						targetIds: [data.organizationId],
					},
					NotificationChannelType.IN_APP,
				);

				ctx.log.info(
					`Join request notification sent for user ${data.userId} to organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error("Failed to send join request notification:", error);
			}
		});
	}

	async emitNewMemberJoined(
		data: {
			userId: string;
			userName: string;
			organizationId: string;
			organizationName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("member.joined", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"new_member_joined",
					{
						userName: data.userName,
						organizationName: data.organizationName,
						organizationId: data.organizationId,
					},
					{
						targetType: NotificationTargetType.ORGANIZATION_ADMIN,
						targetIds: [data.organizationId],
					},
					NotificationChannelType.IN_APP,
				);

				ctx.log.info(
					`New member notification sent for user ${data.userId} joining organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error("Failed to send new member notification:", error);
			}
		});
	}

	async emitUserRemoved(
		data: {
			userId: string;
			userName: string;
			organizationId: string;
			organizationName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("user.removed", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"user_removed",
					{
						userName: data.userName,
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
					`User removal notification sent to user ${data.userId} from organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error("Failed to send user removal notification:", error);
			}
		});
	}
}

export const notificationEventBus = new NotificationEventBus();
