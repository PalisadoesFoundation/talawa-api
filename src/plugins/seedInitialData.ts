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
import { usersTable, usersTableInsertSchema } from "~/src/drizzle/tables/users";

/**
 * This plugin handles seeding the initial data into appropriate service at the startup time of the talawa api. The data must strictly only comprise of things that are required in the production environment of talawa api. This plugin shouldn't be used for seeding dummy data.
 *
 * @example
 * import seedInitialDataPlugin from "./plugins/seedInitialData";
 *
 * fastify.register(seedInitialDataPlugin, {});
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
};

export default fastifyPlugin(plugin, {
	name: "seedDatabase",
});
