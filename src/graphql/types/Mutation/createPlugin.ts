import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import type { IPluginManifest } from "~/src/plugin/types";
import {
	createPluginTables,
	loadPluginManifest,
	safeRequire,
} from "~/src/plugin/utils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { CreatePluginInput, createPluginInputSchema } from "../Plugin/inputs";

/**
 * Resolver for createPlugin mutation
 */
export const createPluginResolver = async (
	_: unknown,
	args: {
		input: {
			pluginId: string;
			isActivated?: boolean | null;
			isInstalled?: boolean | null;
			backup?: boolean | null;
		};
	},
	ctx: GraphQLContext,
) => {
	const { pluginId, isActivated, isInstalled, backup } =
		createPluginInputSchema.parse(args.input);

	// Additional validation for edge cases
	if (!pluginId || pluginId.trim() === "") {
		throw new TalawaGraphQLError({
			extensions: {
				code: "forbidden_action_on_arguments_associated_resources",
				issues: [
					{
						argumentPath: ["input", "pluginId"],
						message: "Plugin ID cannot be empty",
					},
				],
			},
		});
	}

	if (pluginId.length > 100) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "forbidden_action_on_arguments_associated_resources",
				issues: [
					{
						argumentPath: ["input", "pluginId"],
						message: "Plugin ID is too long (maximum 100 characters)",
					},
				],
			},
		});
	}

	// Check for special characters that might cause issues
	const specialCharRegex = /[^a-zA-Z0-9_-]/;
	if (specialCharRegex.test(pluginId)) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "forbidden_action_on_arguments_associated_resources",
				issues: [
					{
						argumentPath: ["input", "pluginId"],
						message:
							"Plugin ID contains invalid characters (only letters, numbers, hyphens, and underscores allowed)",
					},
				],
			},
		});
	}

	try {
		// Check if a plugin with the same pluginId already exists to provide
		// a clear validation error instead of relying on the DB constraint.
		const existingPlugin = await ctx.drizzleClient.query.pluginsTable.findFirst(
			{
				where: eq(pluginsTable.pluginId, pluginId),
			},
		);
		if (existingPlugin) {
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

		// Load plugin manifest to get table definitions
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
		} catch (e) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "pluginId"],
							message: "Manifest not found",
						},
					],
				},
			});
		}
		console.log("Plugin manifest loaded:", manifest);

		// Create plugin-defined tables during creation (not activation)
		if (
			manifest.extensionPoints?.database &&
			manifest.extensionPoints.database.length > 0
		) {
			console.log(`Creating plugin-defined tables for: ${pluginId}`);

			const tableDefinitions: Record<string, Record<string, unknown>> = {};

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
					throw new Error(`Failed to load table file: ${tableExtension.file}`);
				}

				const tableDefinition = tableModule[tableExtension.name] as Record<
					string,
					unknown
				>;
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
					console, // Using console as logger for now
				);
			} catch (e) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "Table creation failed",
							},
						],
					},
				});
			}

			console.log("Successfully created plugin-defined tables for:", pluginId);
		} else {
			console.log("No plugin-defined tables found for:", pluginId);
		}

		// Insert plugin record into plugins table
		const [plugin] = await ctx.drizzleClient
			.insert(pluginsTable)
			.values({
				pluginId,
				isActivated: isActivated ?? false,
				isInstalled: isInstalled ?? true,
				backup: backup ?? false,
			})
			.returning();

		// Handle plugin activation during creation (GraphQL extensions hookup)
		if (isActivated) {
			const pluginManager = getPluginManagerInstance();
			if (!pluginManager) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "Plugin manager is not available",
							},
						],
					},
				});
			}

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
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "Failed to activate plugin",
							},
						],
					},
				});
			}
		}

		return plugin;
	} catch (error: unknown) {
		const err = error as { code?: string; message?: string };

		// If it's already a TalawaGraphQLError, re-throw it
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}

		// Handle manifest loading errors
		if (
			error instanceof Error &&
			error.message.includes("Manifest not found")
		) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "pluginId"],
							message: "Manifest not found",
						},
					],
				},
			});
		}

		// Handle table creation errors
		if (
			error instanceof Error &&
			error.message.includes("Table creation failed")
		) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "pluginId"],
							message: "Table creation failed",
						},
					],
				},
			});
		}

		if (
			err.code === "23505" ||
			(error instanceof Error && error.message.includes("23505"))
		) {
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

		// Re-throw other errors
		throw error;
	}
};

/**
 * GraphQL Mutation: Creates a new plugin.
 */
export const createPlugin = builder.mutationField("createPlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input parameters to create a new plugin.",
				required: true,
				type: CreatePluginInput,
			}),
		},
		description: "Mutation field to create a new plugin.",
		resolve: createPluginResolver,
		type: Plugin,
	}),
);
