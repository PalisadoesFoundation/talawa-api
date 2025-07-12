import { and } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
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
	 * @returns The created notification log ID
	 */
	async createNotification(
		eventType: string,
		variables: NotificationVariables,
		audience: NotificationAudience | NotificationAudience[],
		channelType: NotificationChannelType = NotificationChannelType.IN_APP,
	): Promise<string> {
		// Get the current user as sender
		const senderId = this.ctx.currentClient.isAuthenticated
			? this.ctx.currentClient.user.id
			: null;

		// Find appropriate template
		// Define an interface for the template result
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

		// Render the content by replacing variables in template
		const renderedContent = this.renderTemplate(template, variables);

		// Create notification log entry
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
				status: "delivered",
			})
			.returning();

		if (!notificationLog) {
			throw new Error("Failed to create notification log");
		}

		// Process each audience specification
		const audiences = Array.isArray(audience) ? audience : [audience];

		// Create audience entries for all recipients
		for (const audienceSpec of audiences) {
			await this.createAudienceEntries(notificationLog.id, audienceSpec);
		}

		return notificationLog.id;
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

		// Direct targeting of specific users or entities
		if (targetIds.length > 0) {
			await this.ctx.drizzleClient.insert(notificationAudienceTable).values(
				targetIds.map((targetId) => ({
					notificationId,
					targetType,
					targetId,
					isRead: false,
				})),
			);
			return;
		}

		// Handle special audience types that need resolution
		if (targetType === NotificationTargetType.ORGANIZATION_ADMIN) {
			const orgId = audience.targetIds[0];

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

			if (adminMembers.length > 0) {
				await this.ctx.drizzleClient.insert(notificationAudienceTable).values(
					adminMembers.map((member) => ({
						notificationId,
						targetType: NotificationTargetType.USER,
						targetId: member.memberId,
						isRead: false,
					})),
				);
			}
		} else if (targetType === NotificationTargetType.ADMIN) {
			const admins = await this.ctx.drizzleClient.query.usersTable.findMany({
				columns: { id: true },
				where: (fields, operators) =>
					operators.eq(fields.role, "administrator"),
			});

			if (admins.length > 0) {
				await this.ctx.drizzleClient.insert(notificationAudienceTable).values(
					admins.map((admin) => ({
						notificationId,
						targetType: NotificationTargetType.USER,
						targetId: admin.id,
						isRead: false,
					})),
				);
			}
		} else if (targetType === NotificationTargetType.ORGANIZATION) {
			// For an entire organization, query all members
			const orgId = audience.targetIds[0];

			if (!orgId) return;

			const members =
				await this.ctx.drizzleClient.query.organizationMembershipsTable.findMany(
					{
						columns: { memberId: true },
						where: (fields, operators) =>
							operators.eq(fields.organizationId, orgId),
					},
				);

			if (members.length > 0) {
				await this.ctx.drizzleClient.insert(notificationAudienceTable).values(
					members.map((member) => ({
						notificationId,
						targetType: NotificationTargetType.USER,
						targetId: member.memberId,
						isRead: false,
					})),
				);
			}
		}
	}

	/**
	 * Renders a template by replacing variables
	 *
	 * @param template - The notification template
	 * @param variables - Variables to replace in the template
	 * @returns Rendered content object
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
}
