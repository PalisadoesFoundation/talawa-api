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

				// Create plugin-defined tables during installation
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
						console.log("Loading plugin in plugin manager:", pluginId);

						// Load plugin if not already loaded
						if (!pluginManager.isPluginLoaded(pluginId)) {
							await pluginManager.loadPlugin(pluginId);
						}

						console.log("Plugin loaded successfully in plugin manager:", pluginId);
					} catch (error) {
						console.error("Error during plugin manager integration:", error);
						// Don't throw error here - plugin is installed but manager integration failed
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
