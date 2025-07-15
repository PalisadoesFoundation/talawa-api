import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import type { IPluginManifest } from "~/src/plugin/types";
import {
	createPluginTables,
	dropPluginTables,
	loadPluginManifest,
	removePluginDirectory,
	safeRequire,
} from "~/src/plugin/utils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	CreatePluginInput,
	DeletePluginInput,
	UpdatePluginInput,
	createPluginInputSchema,
	deletePluginInputSchema,
	updatePluginInputSchema,
} from "../Plugin/inputs";

// Schemas are now imported from inputs.ts to avoid duplication

builder.mutationFields((t) => ({
	createPlugin: t.field({
		type: Plugin,
		args: {
			input: t.arg({ type: CreatePluginInput, required: true }),
		},
		resolve: async (_, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = createPluginInputSchema.safeParse(args.input);

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

			const {
				pluginId,
				isActivated = false,
				isInstalled = true,
				backup = false,
			} = parsedArgs;

			// Check for existing plugin with same pluginId to avoid race conditions
			const existing = await ctx.drizzleClient.query.pluginsTable.findFirst({
				where: eq(pluginsTable.pluginId, pluginId),
			});
			if (existing) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "A plugin with this ID already exists",
							},
						],
					},
				});
			}

			// Load plugin manifest and create tables if files are installed
			if (isInstalled) {
				try {
					// Load plugin manifest from available folder
					const pluginsDirectory = path.join(
						process.cwd(),
						"src",
						"plugin",
						"available",
					);
					const pluginPath = path.join(pluginsDirectory, pluginId);

					console.log("Loading plugin manifest for:", pluginId);
					let manifest: IPluginManifest;
					try {
						manifest = await loadPluginManifest(pluginPath);
						console.log("Plugin manifest loaded:", manifest);
					} catch (error) {
						console.error(`Failed to load manifest for ${pluginId}:`, error);
						throw new TalawaGraphQLError({
							extensions: {
								code: "forbidden_action_on_arguments_associated_resources",
								issues: [
									{
										argumentPath: ["input", "pluginId"],
										message:
											"Plugin manifest not found or invalid. Ensure plugin files are properly installed in available folder.",
									},
								],
							},
						});
					}

					// Create plugin-defined tables during creation (not activation)
					if (
						manifest.extensionPoints?.database &&
						manifest.extensionPoints.database.length > 0
					) {
						console.log(`Creating plugin-defined tables for: ${pluginId}`);

						const tableDefinitions: Record<
							string,
							Record<string, unknown>
						> = {};

						// Load each table definition
						for (const tableExtension of manifest.extensionPoints.database) {
							console.log(
								"Loading table definition:",
								tableExtension.name,
								"from",
								tableExtension.file,
							);

							const tableFilePath = path.join(pluginPath, tableExtension.file);
							const tableModule =
								await safeRequire<Record<string, Record<string, unknown>>>(
									tableFilePath,
								);

							if (!tableModule) {
								throw new Error(
									`Failed to load table file: ${tableExtension.file}`,
								);
							}

							const tableDefinition = tableModule[
								tableExtension.name
							] as Record<string, unknown>;
							if (!tableDefinition) {
								throw new Error(
									`Table '${tableExtension.name}' not found in file: ${tableExtension.file}`,
								);
							}

							tableDefinitions[tableExtension.name] = tableDefinition;
							console.log("Table definition loaded:", tableExtension.name);
						}

						// Create the plugin-defined tables
						try {
							await createPluginTables(
								ctx.drizzleClient as unknown as {
									execute: (sql: string) => Promise<unknown>;
								},
								pluginId,
								tableDefinitions,
								console, // Using console as logger
							);
							console.log(
								"Successfully created plugin-defined tables for:",
								pluginId,
							);
						} catch (error) {
							console.error(`Failed to create tables for ${pluginId}:`, error);
							throw new TalawaGraphQLError({
								extensions: {
									code: "forbidden_action_on_arguments_associated_resources",
									issues: [
										{
											argumentPath: ["input", "pluginId"],
											message: "Failed to create plugin database tables",
										},
									],
								},
							});
						}
					} else {
						console.log("No plugin-defined tables found for:", pluginId);
					}
				} catch (error) {
					// Re-throw TalawaGraphQLError as-is
					if (error instanceof TalawaGraphQLError) {
						throw error;
					}
					// Handle other errors
					console.error(
						`Error during plugin table creation for ${pluginId}:`,
						error,
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "pluginId"],
									message: `Plugin creation failed: ${
										error instanceof Error ? error.message : "Unknown error"
									}`,
								},
							],
						},
					});
				}
			}

			// Create plugin record in database
			const [plugin] = await ctx.drizzleClient
				.insert(pluginsTable)
				.values({
					pluginId,
					isActivated,
					isInstalled,
					backup,
				})
				.returning();

			// Handle plugin activation during creation (GraphQL extensions hookup)
			if (isActivated && isInstalled) {
				const pluginManager = getPluginManagerInstance();
				if (pluginManager) {
					try {
						console.log("Activating newly created plugin:", pluginId);

						// Load plugin if not already loaded
						if (!pluginManager.isPluginLoaded(pluginId)) {
							await pluginManager.loadPlugin(pluginId);
						}

						// Activate the plugin (hooks up GraphQL extensions, etc.)
						await pluginManager.activatePlugin(pluginId);

						console.log("Plugin activated successfully:", pluginId);
					} catch (error) {
						console.error("Error during plugin activation:", error);
						// Don't throw error here - plugin is created but not activated
						// User can activate it manually later
					}
				}
			}

			return plugin;
		},
	}),

	updatePlugin: t.field({
		type: Plugin,
		args: {
			input: t.arg({ type: UpdatePluginInput, required: true }),
		},
		resolve: async (_, args, ctx) => {
			const { id, pluginId, isActivated, isInstalled, backup } =
				updatePluginInputSchema.parse(args.input);

			// Guard against no-op updates - if only id is provided, return early
			if (
				pluginId === undefined &&
				isActivated === undefined &&
				isInstalled === undefined &&
				backup === undefined
			) {
				// Fetch the existing plugin to return it
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

				return existingPlugin;
			}

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

			// Only check for duplicates if pluginId is being changed to a different value
			if (pluginId && pluginId !== existingPlugin.pluginId) {
				const duplicatePlugin =
					await ctx.drizzleClient.query.pluginsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.pluginId, pluginId),
					});

				if (duplicatePlugin) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "pluginId"],
									message: "A plugin with this ID already exists",
								},
							],
						},
					});
				}
			}

			// Detect activation status changes
			const wasActivated = existingPlugin.isActivated;
			const willBeActivated = isActivated ?? existingPlugin.isActivated;
			const activationChanged = wasActivated !== willBeActivated;

			try {
				const [plugin] = await ctx.drizzleClient
					.update(pluginsTable)
					.set({
						pluginId: pluginId ?? existingPlugin.pluginId,
						isActivated: isActivated ?? existingPlugin.isActivated,
						isInstalled: isInstalled ?? existingPlugin.isInstalled,
						backup: backup ?? existingPlugin.backup,
					})
					.where(eq(pluginsTable.id, id))
					.returning();

				// Handle dynamic plugin activation/deactivation
				if (activationChanged) {
					const pluginManager = getPluginManagerInstance();
					if (pluginManager) {
						const targetPluginId = pluginId ?? existingPlugin.pluginId;

						try {
							if (willBeActivated) {
								// Plugin is being activated
								console.log(`Activating plugin: ${targetPluginId}`);

								// Load plugin if not already loaded
								if (!pluginManager.isPluginLoaded(targetPluginId)) {
									await pluginManager.loadPlugin(targetPluginId);
								}

								// Activate the plugin (registers GraphQL, etc.)
								await pluginManager.activatePlugin(targetPluginId);

								console.log(`Plugin activated successfully: ${targetPluginId}`);
							} else {
								// Plugin is being deactivated
								console.log(`Deactivating plugin: ${targetPluginId}`);
								await pluginManager.deactivatePlugin(targetPluginId);
								console.log(
									`Plugin deactivated successfully: ${targetPluginId}`,
								);
							}
						} catch (error) {
							console.error(
								`Error during plugin ${
									willBeActivated ? "activation" : "deactivation"
								}:`,
								error,
							);
							// Note: We don't throw here to avoid breaking the DB update,
							// but in production you might want to rollback the DB change
						}
					}
				}

				return plugin;
			} catch (error: unknown) {
				// Handle database errors
				if (
					error instanceof Error &&
					error.message.includes("Database connection failed")
				) {
					throw new Error("Database connection failed");
				}

				// Re-throw other errors
				throw error;
			}
		},
	}),

	deletePlugin: t.field({
		type: Plugin,
		args: {
			input: t.arg({ type: DeletePluginInput, required: true }),
		},
		resolve: async (_, args, ctx) => {
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
}));
