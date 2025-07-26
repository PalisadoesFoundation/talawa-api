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

				// Send both in-app AND email notifications for join requests
				await Promise.all([
					// In-app notification
					notificationEngine.createNotification(
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
					),
					// Email notification to organization admins
					notificationEngine.createNotification(
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
						NotificationChannelType.EMAIL,
					),
				]);

				ctx.log.info(
					`Join request notifications (in-app + email) sent for user ${data.userId} to organization ${data.organizationId}`,
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
						targetType: NotificationTargetType.ORGANIZATION,
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

	async emitUserBlocked(
		data: {
			userId: string;
			userName: string;
			organizationId: string;
			organizationName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("user.blocked", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"user_blocked",
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
					`User blocked notification sent to user ${data.userId} from organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error("Failed to send user blocked notification:", error);
			}
		});
	}

	async emitMembershipRequestRejected(
		data: {
			userId: string;
			userName: string;
			organizationId: string;
			organizationName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("membership_request.rejected", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"membership_request_rejected",
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
					`Membership request rejection notification sent to user ${data.userId} for organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error(
					"Failed to send membership request rejection notification:",
					error,
				);
			}
		});
	}

	async emitFundCreated(
		data: {
			fundId: string;
			fundName: string;
			organizationId: string;
			organizationName: string;
			creatorName: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("fund.created", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"fund_created",
					{
						fundName: data.fundName,
						organizationName: data.organizationName,
						organizationId: data.organizationId,
						creatorName: data.creatorName,
					},
					{
						targetType: NotificationTargetType.ORGANIZATION,
						targetIds: [data.organizationId],
					},
					NotificationChannelType.IN_APP,
				);

				ctx.log.info(
					`Fund creation notification sent for fund ${data.fundId} in organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error("Failed to send fund creation notification:", error);
			}
		});
	}

	async emitFundCampaignCreated(
		data: {
			campaignId: string;
			campaignName: string;
			fundName: string;
			organizationId: string;
			organizationName: string;
			creatorName: string;
			goalAmount: string;
			currencyCode: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("fund_campaign.created", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"fund_campaign_created",
					{
						campaignName: data.campaignName,
						fundName: data.fundName,
						organizationName: data.organizationName,
						organizationId: data.organizationId,
						creatorName: data.creatorName,
						goalAmount: data.goalAmount,
						currencyCode: data.currencyCode,
					},
					{
						targetType: NotificationTargetType.ORGANIZATION,
						targetIds: [data.organizationId],
					},
					NotificationChannelType.IN_APP,
				);

				ctx.log.info(
					`Fund campaign creation notification sent for campaign ${data.campaignId} in organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error(
					"Failed to send fund campaign creation notification:",
					error,
				);
			}
		});
	}

	async emitFundCampaignPledgeCreated(
		data: {
			pledgeId: string;
			campaignName: string;
			organizationId: string;
			organizationName: string;
			pledgerName: string;
			amount: string;
			currencyCode: string;
		},
		ctx: GraphQLContext,
	) {
		this.emit("fund_campaign_pledge.created", data);

		setImmediate(async () => {
			try {
				const notificationEngine = new NotificationEngine(ctx);
				await notificationEngine.createNotification(
					"fund_campaign_pledge_created",
					{
						campaignName: data.campaignName,
						organizationName: data.organizationName,
						organizationId: data.organizationId,
						pledgerName: data.pledgerName,
						amount: data.amount,
						currencyCode: data.currencyCode,
					},
					{
						targetType: NotificationTargetType.ORGANIZATION,
						targetIds: [data.organizationId],
					},
					NotificationChannelType.IN_APP,
				);

				ctx.log.info(
					`Fund campaign pledge notification sent for pledge ${data.pledgeId} in organization ${data.organizationId}`,
				);
			} catch (error) {
				ctx.log.error(
					"Failed to send fund campaign pledge notification:",
					error,
				);
			}
		});
	}
}

export const notificationEventBus = new NotificationEventBus();
