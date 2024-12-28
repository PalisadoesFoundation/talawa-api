import { hash } from "@node-rs/argon2";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { uuidv7 } from "uuidv7";
import type { z } from "zod";
import { usersTable, usersTableInsertSchema } from "~/src/drizzle/tables/users";

// TODO:- Will be replaced with a different implementation in the future.

/**
 * This plugin handles seeding the database with data at the startup time of the talawa api.
 *
 * @example
 * import seedDatabasePlugin from "./plugins/seedDatabase";
 *
 * fastify.register(seedDatabasePlugin, {});
 */
const plugin: FastifyPluginAsync = async (fastify) => {
	fastify.log.info(
		"Checking if the administrator already exists in the database.",
	);

	let existingAdministrator:
		| Pick<typeof usersTable.$inferSelect, "role">
		| undefined;

	try {
		existingAdministrator =
			await fastify.drizzleClient.query.usersTable.findFirst({
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
			"Failed to check if the administrator already exists in the database.",
			{
				cause: error,
			},
		);
	}

	if (existingAdministrator !== undefined) {
		fastify.log.info(
			"Administrator already exists in the database. Skipping, the administrator creation.",
		);
	} else {
		fastify.log.info(
			"Administrator does not exist in the database. Creating the administrator.",
		);

		const userId = uuidv7();
		const input: z.infer<typeof usersTableInsertSchema> = {
			creatorId: userId,
			emailAddress: fastify.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			id: userId,
			isEmailAddressVerified: true,
			name: "name",
			passwordHash: await hash(
				fastify.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			),
			role: "administrator",
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
};

export default fastifyPlugin(plugin, {
	name: "seedDatabase",
});
