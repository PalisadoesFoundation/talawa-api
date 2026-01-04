import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import fastifyPlugin from "fastify-plugin";
import * as drizzleSchema from "~/src/drizzle/schema";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

declare module "fastify" {
	interface FastifyInstance {
		drizzleClient: PostgresJsDatabase<typeof drizzleSchema>;
	}
}

/**
 * Type alias for the Drizzle client with the full schema.
 */
export type DrizzleClient = PostgresJsDatabase<typeof drizzleSchema>;

/**
 * Integrates a drizzle client instance on a namespace `drizzleClient` on the global fastify instance.
 *
 * @example
 * ```typescript
 * import drizzleClientPlugin from "~/src/plugins/drizzleClient";
 *
 * fastify.register(drizzleClientPlugin, {});
 * const user = await fastify.drizzleClient.query.usersTable.findFirst();
 * ```
 */
export const drizzleClient = fastifyPlugin(
	async (fastify) => {
		const drizzleClient = drizzle({
			connection: {
				database: fastify.envConfig.API_POSTGRES_DATABASE,
				host: fastify.envConfig.API_POSTGRES_HOST,
				password: fastify.envConfig.API_POSTGRES_PASSWORD,
				port: fastify.envConfig.API_POSTGRES_PORT,
				ssl: fastify.envConfig.API_POSTGRES_SSL_MODE,
				user: fastify.envConfig.API_POSTGRES_USER,
			},
			// logger: new DrizzlePinoLogger(),
			schema: drizzleSchema,
		});

		// Checks for successful connection to the postgres database on server startup.
		try {
			fastify.log.info("Checking the connection to the postgres database.");
			await drizzleClient.execute("select 1");
			fastify.log.info("Successfully connected to the postgres database.");
		} catch (error) {
			throw new TalawaRestError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to connect to the postgres database.",
				details: { cause: error },
			});
		}

		// Gracefully close the postgres connection when the fastify server is shutting down.
		fastify.addHook("onClose", async () => {
			try {
				fastify.log.info(
					"Closing all the connections in the postgres connection pool.",
				);
				await drizzleClient.$client.end();
				fastify.log.info(
					"Successfully closed all the connections in the postgres connection pool.",
				);
			} catch (error) {
				fastify.log.error(
					{ error },
					"Something went wrong while trying to close all the connections in the postgres connection pool.",
				);
			}
		});

		if (fastify.envConfig.API_IS_APPLY_DRIZZLE_MIGRATIONS) {
			try {
				fastify.log.info(
					"Applying the drizzle migration files to the postgres database.",
				);
				await migrate(drizzleClient, {
					migrationsFolder: `${import.meta.dirname}/../../drizzle_migrations`,
				});
				fastify.log.info(
					"Successfully applied the drizzle migrations to the postgres database.",
				);
			} catch (error) {
				// Check if it's an "already exists" error - these are expected if migrations were already applied
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				const errorCode =
					error && typeof error === "object" && "code" in error
						? String(error.code)
						: "";
				const causeCode =
					error &&
					typeof error === "object" &&
					"cause" in error &&
					error.cause &&
					typeof error.cause === "object" &&
					"code" in error.cause
						? String(error.cause.code)
						: "";

				const isAlreadyExistsError =
					errorMessage.includes("already exists") ||
					errorMessage.includes("42P06") || // schema already exists
					errorMessage.includes("42P07") || // relation already exists
					errorMessage.includes("42710") || // duplicate object
					errorCode === "42P06" ||
					errorCode === "42P07" ||
					errorCode === "42710" ||
					causeCode === "42P06" ||
					causeCode === "42P07" ||
					causeCode === "42710";

				if (isAlreadyExistsError) {
					// Log but continue if it's just an "already exists" error
					fastify.log.info(
						"Migrations already applied or partially applied, continuing...",
					);
				} else {
					// Re-throw if it's not an "already exists" error
          throw new TalawaRestError({
					code: ErrorCode.DATABASE_ERROR,
					message:
						"Failed to apply the drizzle migrations to the postgres database.",
					details: { cause: error },
				});
				}
			}
		}

		fastify.decorate("drizzleClient", drizzleClient);
	},
	{
		name: "drizzleClient", // Add explicit plugin name
	},
);

export default drizzleClient;
