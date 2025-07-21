import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import type { IPluginManifest } from "~/src/plugin/types";
import {
	dropPluginTables,
	loadPluginManifest,
	removePluginDirectory,
	safeRequire,
} from "~/src/plugin/utils";
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

			// Get plugin manager for cleanup
			const pluginManager = getPluginManagerInstance();
			if (pluginManager) {
				const pluginId = existingPlugin.pluginId;

				// Check if plugin is loaded
				const isLoaded = pluginManager.isPluginLoaded(pluginId);
				const isActive = pluginManager.isPluginActive(pluginId);

				// Deactivate plugin if it's active
				if (isActive) {
					try {
						await pluginManager.deactivatePlugin(pluginId);
					} catch (error) {
						console.error("Error during plugin deactivation:", error);
						// Continue with deletion even if deactivation fails
					}
				}

				// Unload plugin if it's loaded
				if (isLoaded) {
					try {
						await pluginManager.unloadPlugin(pluginId);
					} catch (error) {
						console.error("Error during plugin unloading:", error);
						// Continue with deletion even if unloading fails
					}
				}
			}

			// Drop plugin-defined database tables before deleting plugin record
			try {
				// Load plugin manifest to get table definitions
				const pluginsDirectory = path.join(
					process.cwd(),
					"src",
					"plugin",
					"available",
				);
				const pluginPath = path.join(pluginsDirectory, existingPlugin.pluginId);

				console.log(
					"Loading plugin manifest for table cleanup:",
					existingPlugin.pluginId,
				);
				let manifest: IPluginManifest | undefined;
				try {
					manifest = await loadPluginManifest(pluginPath);
					console.log("Plugin manifest loaded for cleanup:", manifest);
				} catch (error) {
					console.warn(
						`Failed to load manifest for cleanup of ${existingPlugin.pluginId}:`,
						error,
					);
					// Continue with deletion even if manifest can't be loaded
					manifest = undefined;
				}

				// Drop plugin-defined tables if manifest was loaded successfully
				if (
					manifest?.extensionPoints?.database &&
					manifest.extensionPoints.database.length > 0
				) {
					console.log(
						`Dropping plugin-defined tables for: ${existingPlugin.pluginId}`,
					);

					const tableDefinitions: Record<string, Record<string, unknown>> = {};

					// Load each table definition
					for (const tableExtension of manifest.extensionPoints.database) {
						console.log(
							"Loading table definition for cleanup:",
							tableExtension.name,
							"from",
							tableExtension.file,
						);

						try {
							const tableFilePath = path.join(pluginPath, tableExtension.file);
							const tableModule =
								await safeRequire<Record<string, Record<string, unknown>>>(
									tableFilePath,
								);

							if (tableModule) {
								const tableDefinition = tableModule[
									tableExtension.name
								] as Record<string, unknown>;
								if (tableDefinition) {
									tableDefinitions[tableExtension.name] = tableDefinition;
									console.log(
										"Table definition loaded for cleanup:",
										tableExtension.name,
									);
								} else {
									console.warn(
										`Table '${tableExtension.name}' not found in file: ${tableExtension.file}`,
									);
								}
							} else {
								console.warn(
									`Failed to load table file: ${tableExtension.file}`,
								);
							}
						} catch (error) {
							console.warn(
								`Error loading table definition ${tableExtension.name}:`,
								error,
							);
							// Continue with other tables even if one fails
						}
					}

					// Drop the plugin-defined tables
					if (Object.keys(tableDefinitions).length > 0) {
						try {
							await dropPluginTables(
								ctx.drizzleClient as unknown as {
									execute: (sql: string) => Promise<unknown>;
								},
								existingPlugin.pluginId,
								tableDefinitions,
								console, // Using console as logger
							);
							console.log(
								"Successfully dropped plugin-defined tables for:",
								existingPlugin.pluginId,
							);
						} catch (error) {
							console.error(
								`Failed to drop tables for ${existingPlugin.pluginId}:`,
								error,
							);
							// Continue with deletion even if table cleanup fails
						}
					}
				} else {
					console.log(
						"No plugin-defined tables to drop for:",
						existingPlugin.pluginId,
					);
				}
			} catch (error) {
				console.error(
					`Error during plugin table cleanup for ${existingPlugin.pluginId}:`,
					error,
				);
				// Continue with deletion even if table cleanup fails
			}

			// Delete from database first
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

			// Force schema rebuild after plugin deletion to ensure complete cleanup
			try {
				const pluginManager = getPluginManagerInstance();
				if (pluginManager) {
					// Emit schema rebuild event
					pluginManager.emit("schema:rebuild", {
						pluginId: existingPlugin.pluginId,
						reason: "plugin_deletion",
						timestamp: new Date().toISOString(),
					});
				}

				console.log(
					`Plugin ${existingPlugin.pluginId} deleted successfully with schema cleanup`,
				);
			} catch (error) {
				console.error("Schema rebuild after deletion failed:", error);
				// Don't throw - plugin is already deleted from database
			}

			// Remove plugin directory from filesystem (after cleanup delay)
			setTimeout(async () => {
				try {
					await removePluginDirectory(existingPlugin.pluginId);
					console.log(
						`Plugin directory removed for: ${existingPlugin.pluginId}`,
					);
				} catch (error) {
					console.error(
						`Failed to remove plugin directory for ${existingPlugin.pluginId}:`,
						error,
					);
					// File cleanup failure doesn't affect the plugin deletion
					// The plugin is already removed from database and schema
				}
			}, 1000); // 1 second delay to allow cleanup

			return plugin;
		},
	}),
);
