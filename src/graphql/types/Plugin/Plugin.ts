import type { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";

/**
 * GraphQL type for Plugin
 */
export const Plugin =
	builder.objectRef<typeof pluginsTable.$inferSelect>("Plugin");

Plugin.implement({
	fields: (t) => ({
		id: t.exposeID("id"),
		pluginId: t.exposeString("pluginId"),
		isActivated: t.exposeBoolean("isActivated"),
		isInstalled: t.exposeBoolean("isInstalled"),
		backup: t.exposeBoolean("backup"),
		createdAt: t.expose("createdAt", {
			type: "DateTime",
		}),
		updatedAt: t.expose("updatedAt", {
			type: "DateTime",
			nullable: true,
		}),
	}),
});
