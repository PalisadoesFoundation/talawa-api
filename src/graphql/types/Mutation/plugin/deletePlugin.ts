import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import { removePluginDirectory } from "~/src/plugin/utils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	DeletePluginInput,
	deletePluginInputSchema,
} from "../../Plugin/inputs";

builder.mutationField("deletePlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				type: DeletePluginInput,
				required: true,
			}),
		},
		type: Plugin,
		resolve: async (_parent, args, ctx) => {
			const { id } = deletePluginInputSchema.parse(args.input);

			// Find the plugin first to get its pluginId for cleanup
			const existingPlugin =
				await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.id, id),
				});

			if (!existingPlugin) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// Handle plugin manager integration for uninstallation
			const pluginManager = getPluginManagerInstance();
			if (pluginManager) {
				try {
					ctx.log.info(
						{ pluginId: existingPlugin.pluginId },
						"Uninstalling plugin via lifecycle manager",
					);

					// Use the plugin manager to handle uninstallation
					const success = await pluginManager.uninstallPlugin(
						existingPlugin.pluginId,
					);

					if (!success) {
						ctx.log.error(
							{ pluginId: existingPlugin.pluginId },
							"Plugin uninstallation failed in lifecycle manager",
						);
						// Continue with deletion even if lifecycle fails
					} else {
						ctx.log.info(
							{ pluginId: existingPlugin.pluginId },
							"Plugin uninstalled successfully via lifecycle manager",
						);
					}
				} catch (error) {
					ctx.log.error(error, "Error during plugin lifecycle uninstallation");
					// Continue with deletion even if lifecycle fails
				}
			}

			// Remove plugin directory from filesystem first
			try {
				await removePluginDirectory(existingPlugin.pluginId);
			} catch (error) {
				ctx.log.error(
					{ error, pluginId: existingPlugin.pluginId },
					`Failed to remove plugin directory for ${existingPlugin.pluginId}`,
				);
				// If file removal fails, don't proceed with database deletion
				// This allows user to retry the deletion
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						issues: [
							{
								argumentPath: ["input", "id"],
								message: `Failed to remove plugin files: ${error}`,
							},
						],
					},
				});
			}

			// Delete from database after successful file removal
			const [plugin] = await ctx.drizzleClient
				.delete(pluginsTable)
				.where(eq(pluginsTable.id, id))
				.returning();

			if (!plugin) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return plugin;
		},
	}),
);
