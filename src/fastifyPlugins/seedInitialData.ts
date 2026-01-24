import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { uuidv7 } from "uuidv7";
import type { z } from "zod";
import {
	communitiesTable,
	communitiesTableInsertSchema,
} from "~/src/drizzle/tables/communities";
import {
	notificationTemplatesTable,
	notificationTemplatesTableInsertSchema,
} from "~/src/drizzle/tables/NotificationTemplate";
import { usersTable, usersTableInsertSchema } from "~/src/drizzle/tables/users";

/**
 * This plugin handles seeding the initial data into appropriate service at the startup time of the talawa api. The data must strictly only comprise of things that are required in the production environment of talawa api. This plugin shouldn't be used for seeding dummy data.
 *
 * @example
 * ```typescript
 * import seedInitialDataPlugin from "./plugins/seedInitialData";
 *
 * fastify.register(seedInitialDataPlugin, \\{\\});
 * ```
 */
const plugin: FastifyPluginAsync = async (fastify) => {
	fastify.log.info(
		"Checking if the administrator user already exists in the database.",
	);

	let existingUser: Pick<typeof usersTable.$inferSelect, "role"> | undefined;

	try {
		existingUser = await fastify.drizzleClient.query.usersTable.findFirst({
			columns: {
				role: true,
			},
			where: (fields, operators) =>
				operators.eq(
					fields.emailAddress,
					fastify.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				),
		});
	} catch (error) {
		throw new Error(
			"Failed to check if the administrator user already exists in the database.",
			{
				cause: error,
			},
		);
	}

	if (existingUser !== undefined) {
		if (existingUser.role !== "administrator") {
			fastify.log.info(
				"Administrator user already exists in the database with an invalid role. Assigning the correct role to the administrator user.",
			);

			try {
				await fastify.drizzleClient
					.update(usersTable)
					.set({
						role: "administrator",
					})
					.where(
						eq(
							usersTable.emailAddress,
							fastify.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						),
					);
			} catch (error) {
				throw new Error(
					"Failed to assign the correct role to the existing administrator user.",
					{
						cause: error,
					},
				);
			}

			fastify.log.info(
				"Successfully assigned the correct role to the administrator user.",
			);
		} else {
			fastify.log.info(
				"Administrator user already exists in the database. Skipping, the administrator creation.",
			);
		}
	} else {
		fastify.log.info(
			"Administrator user does not exist in the database. Creating the administrator.",
		);

		const userId = uuidv7();
		const input: z.infer<typeof usersTableInsertSchema> = {
			addressLine1: null,
			addressLine2: null,
			avatarName: null,
			city: null,
			creatorId: userId,
			description: null,
			emailAddress: fastify.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			id: userId,
			isEmailAddressVerified: true,
			name: fastify.envConfig.API_ADMINISTRATOR_USER_NAME,
			passwordHash: await hash(
				fastify.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			),
			postalCode: null,
			role: "administrator",
			state: null,
		};

		try {
			await fastify.drizzleClient
				.insert(usersTable)
				.values(usersTableInsertSchema.parse(input));
		} catch (error) {
			throw new Error("Failed to create the administrator in the database.", {
				cause: error,
			});
		}

		fastify.log.info("Successfully created the administrator in the database.");
	}

	fastify.log.info("Checking if the community already exists in the database.");

	let existingCommunity:
		| Pick<typeof communitiesTable.$inferSelect, "logoMimeType">
		| undefined;

	try {
		existingCommunity =
			await fastify.drizzleClient.query.communitiesTable.findFirst({
				columns: {
					logoMimeType: true,
				},
			});
	} catch (error) {
		throw new Error(
			"Failed to check if the community already exists in the database.",
			{
				cause: error,
			},
		);
	}

	if (existingCommunity !== undefined) {
		fastify.log.info(
			"Community already exists in the database. Skipping, the community creation.",
		);
	} else {
		fastify.log.info(
			"Community does not exist in the database. Creating the community.",
		);

		try {
			await fastify.drizzleClient.insert(communitiesTable).values(
				communitiesTableInsertSchema.parse({
					facebookURL: fastify.envConfig.API_COMMUNITY_FACEBOOK_URL,
					githubURL: fastify.envConfig.API_COMMUNITY_GITHUB_URL,
					inactivityTimeoutDuration:
						fastify.envConfig.API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION,
					instagramURL: fastify.envConfig.API_COMMUNITY_INSTAGRAM_URL,
					linkedinURL: fastify.envConfig.API_COMMUNITY_LINKEDIN_URL,
					name: fastify.envConfig.API_COMMUNITY_NAME,
					redditURL: fastify.envConfig.API_COMMUNITY_REDDIT_URL,
					slackURL: fastify.envConfig.API_COMMUNITY_SLACK_URL,
					websiteURL: fastify.envConfig.API_COMMUNITY_WEBSITE_URL,
					xURL: fastify.envConfig.API_COMMUNITY_X_URL,
					youtubeURL: fastify.envConfig.API_COMMUNITY_YOUTUBE_URL,
				}),
			);
		} catch (error) {
			throw new Error("Failed to create the community in the database.", {
				cause: error,
			});
		}

		fastify.log.info("Successfully created the community in the database.");
	}

	// Guard notification template seeding behind feature flag. Set ENABLE_NOTIFICATION_TEMPLATE_SEEDING=true to enable.
	if (fastify.envConfig.ENABLE_NOTIFICATION_TEMPLATE_SEEDING === true) {
		fastify.log.info("Checking and seeding notification templates.");

		// Check if notification templates table exists before iterating
		if (fastify.drizzleClient.query.notificationTemplatesTable === undefined) {
			fastify.log.warn(
				"Notification templates table not found in drizzle schema. Skipping seeding.",
			);
			return;
		}

		const templates = [
			{
				name: "Post Created",
				eventType: "post_created",
				title: "New Post from {organizationName}",
				body: "{authorName} created a new post: {postCaption}",
				channelType: "in_app",
				linkedRouteName: "PostDetails",
			},
			{
				name: "Event Created",
				eventType: "event_created",
				title: "New Event: {eventName}",
				body: "{creatorName} created an event in {organizationName}",
				channelType: "in_app",
				linkedRouteName: "EventDetails",
			},
			{
				name: "Membership Accepted",
				eventType: "membership_request_accepted",
				body: "Your request to join {organizationName} was accepted.",
				title: "Membership Accepted",
				channelType: "email",
			},
			{
				name: "Membership Rejected",
				eventType: "membership_request_rejected",
				title: "Membership Rejected",
				body: "Your request to join {organizationName} was rejected.",
				channelType: "in_app",
				linkedRouteName: "OrganizationDetails",
			},
			{
				name: "Join Request Submitted",
				eventType: "join_request_submitted",
				title: "New Join Request",
				body: "{userName} requested to join {organizationName}",
				channelType: "in_app",
				linkedRouteName: "ManageRequests",
			},
			{
				name: "Join Request Submitted Email",
				eventType: "join_request_submitted",
				title: "New Join Request",
				body: "{userName} requested to join {organizationName}",
				channelType: "email",
			},
			{
				name: "New Member Joined",
				eventType: "new_member_joined",
				title: "New Member",
				body: "{userName} joined {organizationName}",
				channelType: "in_app",
				linkedRouteName: "MemberProfile",
			},
			{
				name: "User Blocked",
				eventType: "user_blocked",
				title: "User Blocked",
				body: "You have been blocked by {organizationName}",
				channelType: "in_app",
				linkedRouteName: "OrganizationDetails",
			},
			{
				name: "Fund Created",
				eventType: "fund_created",
				title: "New Fund",
				body: "{creatorName} created fund {fundName}",
				channelType: "in_app",
				linkedRouteName: "FundDetails",
			},
			{
				name: "Fund Campaign Created",
				eventType: "fund_campaign_created",
				title: "New Campaign",
				body: "{creatorName} created campaign {campaignName}",
				channelType: "in_app",
				linkedRouteName: "CampaignDetails",
			},
			{
				name: "Fund Campaign Pledge Created",
				eventType: "fund_campaign_pledge_created",
				title: "New Pledge",
				body: "{pledgerName} pledged {amount} {currencyCode}",
				channelType: "in_app",
				linkedRouteName: "CampaignDetails",
			},
			{
				name: "Event Invite",
				eventType: "send_event_invite",
				title: "Event Invitation",
				body: "{inviteeName}, you are invited to {eventName}. Link: {invitationUrl}",
				channelType: "email",
			},
		];

		for (const template of templates) {
			const insertResult = await fastify.drizzleClient
				.insert(notificationTemplatesTable)
				.values(notificationTemplatesTableInsertSchema.parse(template))
				.onConflictDoNothing({
					target: [
						notificationTemplatesTable.eventType,
						notificationTemplatesTable.channelType,
					],
				})
				.returning({ id: notificationTemplatesTable.id });

			// Only log if an actual insert occurred (result has rows)
			if (insertResult.length > 0) {
				fastify.log.info(
					`Seeded template: ${template.eventType} (${template.channelType})`,
				);
			} else {
				fastify.log.info(
					`Template already exists: ${template.eventType} (${template.channelType})`,
				);
			}
		}
		fastify.log.info("Finished seeding notification templates.");
	}
};

export default fastifyPlugin(plugin, {
	name: "seedDatabase",
});
