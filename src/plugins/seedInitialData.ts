import { hash } from "@node-rs/argon2";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { uuidv7 } from "uuidv7";
import type { z } from "zod";
import {
	communitiesTable,
	communitiesTableInsertSchema,
} from "~/src/drizzle/tables/communities";
import {
	organizationMembershipsTable,
	organizationMembershipsTableInsertSchema,
} from "~/src/drizzle/tables/organizationMemberships";
import {
	organizationsTable,
	organizationsTableInsertSchema,
} from "~/src/drizzle/tables/organizations";
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

	fastify.log.info("Checking if an organization with a valid address exists.");

	try {
		const organizationExists = await fastify.drizzleClient
			.select({ addressLine1: organizationsTable.addressLine1 })
			.from(organizationsTable)
			.where(
				and(
					isNotNull(organizationsTable.addressLine1),
					sql`char_length(${organizationsTable.addressLine1}) > 0`,
				),
			)

			.limit(1)
			.then((result) => result.length > 0);

		if (organizationExists) {
			fastify.log.info(
				"Organization with a valid address already exists. Skipping creation.",
			);
			return;
		}

		fastify.log.info(
			"Creating default organization as no valid address was found.",
		);

		const adminUser = await fastify.drizzleClient.query.usersTable.findFirst({
			columns: { id: true },
			where: (fields, operators) =>
				operators.eq(
					fields.emailAddress,
					fastify.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				),
		});

		if (!adminUser) {
			throw new Error("API Administrator user not found.");
		}

		await fastify.drizzleClient.transaction(async (tx) => {
			const organizationId = uuidv7();

			const defaultOrganization = organizationsTableInsertSchema.parse({
				id: organizationId,
				name: "Unity Foundation USA",
				description: "Service to the Community",
				addressLine1: "1268 Finwood Road",
				addressLine2: "Suite 200",
				city: "Dodge City",
				postalCode: "67801",
				state: "Kansas",
				avatarName: null,
				countryCode: "us",
				createdAt: new Date(),
				creatorId: adminUser.id,
			});

			await tx.insert(organizationsTable).values(defaultOrganization);

			await tx.insert(organizationMembershipsTable).values({
				memberId: adminUser.id,
				organizationId,
				role: "administrator",
				creatorId: adminUser.id,
				createdAt: new Date(),
			});

			fastify.log.info(
				"Default organization and admin membership created successfully.",
			);
		});
	} catch (error) {
		fastify.log.error(
			{ err: error },
			"Error while checking or creating organization",
		);
		throw new Error("Database operation failed while handling organization.", {
			cause: error,
		});
	}
};

export default fastifyPlugin(plugin, {
	name: "seedDatabase",
});
