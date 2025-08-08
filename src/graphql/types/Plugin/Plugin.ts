import type { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";

/**
 * GraphQL type for Plugin
 */
export const Plugin =
	builder.objectRef<typeof pluginsTable.$inferSelect>("Plugin");

Plugin.implement({
	description:
		"Represents a plugin in the system with its installation and activation status",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Unique identifier for the plugin record",
		}),
		pluginId: t.exposeString("pluginId", {
			description: "The unique identifier/name of the plugin",
		}),
		isActivated: t.exposeBoolean("isActivated", {
			description: "Whether the plugin is currently activated",
		}),
		isInstalled: t.exposeBoolean("isInstalled", {
			description: "Whether the plugin is installed in the system",
		}),
		backup: t.exposeBoolean("backup", {
			description: "Whether the plugin has an existing backup",
		}),
		createdAt: t.expose("createdAt", {
			type: "DateTime",
			description: "Timestamp when the plugin record was created",
		}),
		updatedAt: t.expose("updatedAt", {
			type: "DateTime",
			nullable: true,
			description: "Timestamp when the plugin record was last updated",
		}),
	}),
});
