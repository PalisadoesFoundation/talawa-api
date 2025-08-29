import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import type { IPluginManifest } from "~/src/plugin/types";
import {
	createPluginTables,
	loadPluginManifest,
	safeRequire,
} from "~/src/plugin/utils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { installPluginInputSchema, InstallPluginInput } from "../../Plugin/inputs";

builder.mutationField("installPlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				type: InstallPluginInput,
				required: true,
			}),
		},
		type: Plugin,
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = installPluginInputSchema.safeParse(args.input);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const { pluginId } = parsedArgs;

			// Check if plugin exists in database
			const existing = await ctx.drizzleClient.query.pluginsTable.findFirst({
				where: eq(pluginsTable.pluginId, pluginId),
			});
			if (!existing) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "Plugin not found in database",
							},
						],
					},
				});
			}

			// Check if plugin is already installed
			if (existing.isInstalled) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "Plugin is already installed",
							},
						],
					},
				});
			}

			try {
				// Update plugin record to mark as installed
				const [updatedPlugin] = await ctx.drizzleClient
					.update(pluginsTable)
					.set({
						isInstalled: true,
					})
					.where(eq(pluginsTable.pluginId, pluginId))
					.returning();

				// Handle plugin manager integration
				const pluginManager = getPluginManagerInstance();
				if (pluginManager) {
					try {
						console.log("Installing plugin via lifecycle manager:", pluginId);
						
						// Use the plugin manager to handle installation
						const success = await pluginManager.installPlugin(pluginId);
						
						if (!success) {
							console.error("Plugin installation failed in lifecycle manager:", pluginId);
							// Don't throw error here - plugin is marked as installed but lifecycle failed
							// User can retry activation later
						} else {
							console.log("Plugin installed successfully via lifecycle manager:", pluginId);
						}
					} catch (error) {
						console.error("Error during plugin lifecycle installation:", error);
						// Don't throw error here - plugin is installed but lifecycle failed
						// User can retry activation later
					}
				}

				return updatedPlugin;
			} catch (error) {
				// Re-throw TalawaGraphQLError as-is
				if (error instanceof TalawaGraphQLError) {
					throw error;
				}
				// Handle other errors
				console.error(
					`Error during plugin installation for ${pluginId}:`,
					error,
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: `Plugin installation failed: ${
									error instanceof Error ? error.message : "Unknown error"
								}`,
							},
						],
					},
				});
			}
		},
	}),
);
