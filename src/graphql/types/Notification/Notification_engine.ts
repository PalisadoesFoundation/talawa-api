import { and } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { emailNotificationsTable } from "~/src/drizzle/tables/EmailNotification";
import { notificationAudienceTable } from "~/src/drizzle/tables/NotificationAudience";
import { notificationLogsTable } from "~/src/drizzle/tables/NotificationLog";
import type { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import type { GraphQLContext } from "~/src/graphql/context";

/**
 * Target types for notification audience
 */
export enum NotificationTargetType {
	USER = "user",
	ORGANIZATION = "organization",
	ADMIN = "admin",
	ORGANIZATION_ADMIN = "organization_admin",
}

/**
 * Channel types for notification delivery
 */
export enum NotificationChannelType {
	EMAIL = "email",
	IN_APP = "in_app",
}

/**
 * Interface for notification variables
 */
export interface NotificationVariables {
	[key: string]: string | number | boolean | null | undefined;
}

/**
 * Interface for audience specification
 */
export interface NotificationAudience {
	targetType: NotificationTargetType;
	targetIds: string[];
}

/**
 * NotificationEngine class for managing notifications across the application
 */
export class NotificationEngine {
	private ctx: GraphQLContext;

	/**
	 * Creates a new instance of NotificationEngine
	 *
	 * @param ctx - GraphQL context containing database connections and user info
	 */
	constructor(ctx: GraphQLContext) {
		this.ctx = ctx;
	}

	/**
	 * Creates a notification using a template and sends it to specified audience
	 *
	 * @param eventType - Type of event that triggered the notification
	 * @param variables - Object containing variables to be replaced in template
	 * @param audience - Target audience for the notification
	 * @param channelType - Channel to deliver notification (in_app, email)
	 * @returns - The created notification log ID
	 */
	async createNotification(
		eventType: string,
		variables: NotificationVariables,
		audience: NotificationAudience | NotificationAudience[],
		channelType: NotificationChannelType = NotificationChannelType.IN_APP,
	): Promise<string> {
		const senderId = this.ctx.currentClient.isAuthenticated
			? this.ctx.currentClient.user.id
			: null;

		type NotificationTemplate = typeof notificationTemplatesTable.$inferSelect;

		const template: NotificationTemplate | undefined =
			await this.ctx.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (fields, operators) =>
					and(
						operators.eq(fields.eventType, eventType),
						operators.eq(fields.channelType, channelType),
					),
			});

		if (!template) {
			throw new Error(
				`No notification template found for event type "${eventType}" and channel "${channelType}"`,
			);
		}

		const renderedContent = this.renderTemplate(template, variables);
		const initialStatus =
			channelType === NotificationChannelType.EMAIL ? "pending" : "delivered";

		const [notificationLog] = await this.ctx.drizzleClient
			.insert(notificationLogsTable)
			.values({
				id: uuidv7(),
				templateId: template.id,
				variables: variables as Record<
					string,
					string | number | boolean | null | undefined
				>,
				renderedContent: renderedContent as { title: string; body: string },
				sender: senderId,
				navigation: template.linkedRouteName,
				eventType: eventType,
				channel: channelType,
				status: initialStatus,
			})
			.returning();

		if (!notificationLog) {
			throw new Error("Failed to create notification log");
		}

		const audiences = Array.isArray(audience) ? audience : [audience];

		if (channelType === NotificationChannelType.EMAIL) {
			this.ctx.log.info({ eventType }, "Sending email notification");
			await this.createEmailNotifications(
				notificationLog.id,
				audiences,
				template,
				variables,
			);
		} else {
			for (const audienceSpec of audiences) {
				await this.createAudienceEntries(notificationLog.id, audienceSpec);
			}
		}

		return notificationLog.id;
	}

	/**
	 * Creates email notification entries for a notification
	 *
	 * @param notificationLogId - ID of the notification log
	 * @param audiences - Array of audience specifications
	 * @param template - The notification template
	 * @param variables - Variables for template rendering
	 */
	private async createEmailNotifications(
		notificationLogId: string,
		audiences: NotificationAudience[],
		template: typeof notificationTemplatesTable.$inferSelect,
		variables: NotificationVariables,
	): Promise<void> {
		const senderId = this.ctx.currentClient.isAuthenticated
			? this.ctx.currentClient.user.id
			: null;

		let allUserIds: string[] = [];
		for (const audienceSpec of audiences) {
			const userIds = await this.resolveAudienceToUserIds(
				audienceSpec,
				senderId,
			);
			allUserIds = [...allUserIds, ...userIds];
		}

		const uniqueUserIds = [...new Set(allUserIds)];

		if (uniqueUserIds.length === 0) {
			this.ctx.log.warn("No users found for email notification");
			return;
		}

		// Get users with email addresses
		const users = await this.ctx.drizzleClient.query.usersTable.findMany({
			columns: { id: true, emailAddress: true },
			where: (fields, operators) => operators.inArray(fields.id, uniqueUserIds),
		});

		// Filter users with valid email addresses
		const usersWithEmail = users.filter(
			(user) => user.emailAddress && user.emailAddress.trim() !== "",
		);

		if (usersWithEmail.length === 0) {
			this.ctx.log.warn("No users found with valid email addresses");
			return;
		}

		// Render email subject and body
		const renderedTemplate = this.renderTemplate(template, variables);
		const subject = renderedTemplate.title;
		const htmlBody = renderedTemplate.body;

		// Creating email notification records
		const emailNotifications = usersWithEmail.map((user) => ({
			id: uuidv7(),
			notificationLogId,
			userId: user.id,
			email: user.emailAddress,
			subject,
			htmlBody,
			status: "pending" as const,
			retryCount: 0,
			maxRetries: 3,
		}));

		// Inserting email notifications
		await this.ctx.drizzleClient
			.insert(emailNotificationsTable)
			.values(emailNotifications);

		this.ctx.log.info(
			`Created ${emailNotifications.length} email notifications`,
		);
	}

	/**
	 * Resolves audience specification to user IDs
	 */
	private async resolveAudienceToUserIds(
		audience: NotificationAudience,
		senderId: string | null,
	): Promise<string[]> {
		const { targetType, targetIds } = audience;
		let userIds: string[] = [];

		if (targetType === NotificationTargetType.USER) {
			userIds = targetIds.filter((id) => id !== senderId);
		} else if (targetType === NotificationTargetType.ORGANIZATION_ADMIN) {
			const orgId = targetIds[0];
			if (!orgId) return [];

			const adminMembers =
				await this.ctx.drizzleClient.query.organizationMembershipsTable.findMany(
					{
						columns: { memberId: true },
						where: (fields, operators) =>
							and(
								operators.eq(fields.organizationId, orgId),
								operators.eq(fields.role, "administrator"),
							),
					},
				);

			userIds = adminMembers
				.map((member) => member.memberId)
				.filter((id) => id !== senderId);
		} else if (targetType === NotificationTargetType.ADMIN) {
			const admins = await this.ctx.drizzleClient.query.usersTable.findMany({
				columns: { id: true },
				where: (fields, operators) =>
					operators.eq(fields.role, "administrator"),
			});

			userIds = admins.map((admin) => admin.id).filter((id) => id !== senderId);
		} else if (targetType === NotificationTargetType.ORGANIZATION) {
			const orgId = targetIds[0];
			if (!orgId) return [];

			const members =
				await this.ctx.drizzleClient.query.organizationMembershipsTable.findMany(
					{
						columns: { memberId: true },
						where: (fields, operators) =>
							operators.eq(fields.organizationId, orgId),
					},
				);

			userIds = members
				.map((member) => member.memberId)
				.filter((id) => id !== senderId);
		}

		return userIds;
	}

	/**
	 * Creates audience entries for a notification
	 *
	 * @param notificationId - ID of the notification log
	 * @param audience - Specification of the target audience
	 */
	private async createAudienceEntries(
		notificationId: string,
		audience: NotificationAudience,
	): Promise<void> {
		const { targetType, targetIds } = audience;
		const senderId = this.ctx.currentClient.isAuthenticated
			? this.ctx.currentClient.user.id
			: null;

		let userIds: string[] = [];

		if (targetType === NotificationTargetType.USER) {
			userIds = targetIds.filter((id) => id !== senderId);
		} else if (targetType === NotificationTargetType.ORGANIZATION_ADMIN) {
			const orgId = targetIds[0];
			if (!orgId) return;

			const adminMembers =
				await this.ctx.drizzleClient.query.organizationMembershipsTable.findMany(
					{
						columns: { memberId: true },
						where: (fields, operators) =>
							and(
								operators.eq(fields.organizationId, orgId),
								operators.eq(fields.role, "administrator"),
							),
					},
				);

			userIds = adminMembers
				.map((member) => member.memberId)
				.filter((id) => id !== senderId);
		} else if (targetType === NotificationTargetType.ADMIN) {
			const admins = await this.ctx.drizzleClient.query.usersTable.findMany({
				columns: { id: true },
				where: (fields, operators) =>
					operators.eq(fields.role, "administrator"),
			});

			userIds = admins.map((admin) => admin.id).filter((id) => id !== senderId);
		} else if (targetType === NotificationTargetType.ORGANIZATION) {
			const orgId = targetIds[0];
			if (!orgId) return;

			const members =
				await this.ctx.drizzleClient.query.organizationMembershipsTable.findMany(
					{
						columns: { memberId: true },
						where: (fields, operators) =>
							operators.eq(fields.organizationId, orgId),
					},
				);

			userIds = members
				.map((member) => member.memberId)
				.filter((id) => id !== senderId);
		}

		if (userIds.length > 0) {
			await this.ctx.drizzleClient.insert(notificationAudienceTable).values(
				userIds.map((userId) => ({
					notificationId,
					userId,
					isRead: false,
				})),
			);
		}
	}

	/**
	 * Renders a template by replacing variables
	 *
	 * @param template - The notification template
	 * @param variables - Variables to replace in the template
	 * @returns - Rendered content object
	 */
	private renderTemplate(
		template: typeof notificationTemplatesTable.$inferSelect,
		variables: NotificationVariables,
	): { title: string; body: string } {
		let title = template.title;
		let body = template.body;

		for (const [key, value] of Object.entries(variables)) {
			if (value === null || value === undefined) continue;
			const placeholder = new RegExp(`{${key}}`, "g");
			title = title.replace(placeholder, String(value));
			body = body.replace(placeholder, String(value));
		}
		return { title, body };
	}

	/**
	 * Creates a direct email notification for external recipients (non-users).
	 * Uses the template system with provided variables for rendering.
	 *
	 * @param eventType - Type of event (e.g., "send_event_invite")
	 * @param variables - Variables to render in the template
	 * @param receiverMail - Email address of the recipient(s)
	 * @param channelType - Channel type (defaults to EMAIL)
	 * @returns - The created email notification ID
	 */
	async createDirectEmailNotification(
		eventType: string,
		variables: NotificationVariables,
		receiverMail: string | string[],
		channelType: NotificationChannelType = NotificationChannelType.EMAIL,
	): Promise<string> {
		const senderId = this.ctx.currentClient.isAuthenticated
			? this.ctx.currentClient.user.id
			: null;
		const template =
			await this.ctx.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (fields, operators) =>
					and(
						operators.eq(fields.eventType, eventType),
						operators.eq(fields.channelType, channelType),
					),
			});
		if (!template) {
			throw new Error(
				`No notification template found for event type "${eventType}" and channel "${channelType}"`,
			);
		}
		const renderedContent = this.renderTemplate(template, variables);
		const initialStatus =
			channelType === NotificationChannelType.EMAIL ? "pending" : "delivered";

		const [notificationLog] = await this.ctx.drizzleClient
			.insert(notificationLogsTable)
			.values({
				id: uuidv7(),
				templateId: template.id,
				variables: variables as Record<
					string,
					string | number | boolean | null | undefined
				>,
				renderedContent: renderedContent as { title: string; body: string },
				sender: senderId,
				navigation: template.linkedRouteName,
				eventType: eventType,
				channel: channelType,
				status: initialStatus,
			})
			.returning();

		if (!notificationLog) {
			throw new Error("Failed to create notification log for direct email");
		}

		const emails = Array.isArray(receiverMail) ? receiverMail : [receiverMail];

		const emailNotifications = emails.map((email) => ({
			id: uuidv7(),
			notificationLogId: notificationLog.id,
			userId: null,
			email: email,
			subject: renderedContent.title,
			htmlBody: renderedContent.body,
			status: "pending" as const,
			retryCount: 0,
			maxRetries: 3,
		}));

		await this.ctx.drizzleClient
			.insert(emailNotificationsTable)
			.values(emailNotifications);

		this.ctx.log.info(
			{
				count: emailNotifications.length,
				recipientEmails: emails,
			},
			"Direct email notification(s) created",
		);

		return notificationLog.id;
	}
}
