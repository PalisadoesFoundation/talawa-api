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
import {
	CreatePluginInput,
	createPluginInputSchema,
} from "../../Plugin/inputs";

builder.mutationField("createPlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				type: CreatePluginInput,
				required: true,
			}),
		},
		type: Plugin,
		resolve: async (_parent, args, ctx) => {
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
);
