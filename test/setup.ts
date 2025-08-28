import { sql } from "drizzle-orm";
import type { GlobalSetupContext } from "vitest/node";
import { server } from "./server";

/**
 * Function that runs before all tests are ran. It re-runs each time one or more tests or javascript modules used within them are mutated in watch mode. More information at this link: {@link https://vitest.dev/config/#globalsetup}
 */
export const setup = async (_ctx: GlobalSetupContext) => {
	await server.ready();
};

/**
 * Function that runs after all tests are ran. It re-runs each time one or more tests or javascript modules used within them are mutated in watch mode. More information at this link: {@link https://vitest.dev/config/#globalsetup}
 */
import * as schema from "~/src/drizzle/schema";
export const teardown = async () => {
	const tableNames = Object.keys(schema);
	const truncatePromises = tableNames.map((tableName) => {
		return server.drizzleClient.execute(
			sql.raw(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`),
		);
	});
	await Promise.all(truncatePromises);
	await server.close();
};
