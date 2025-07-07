import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
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
		const manifest = await loadPluginManifest(pluginPath);
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
			await createPluginTables(
				ctx.drizzleClient as unknown as {
					execute: (sql: string) => Promise<unknown>;
				},
				pluginId,
				tableDefinitions,
				console, // Using console as logger for now
			);

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
					// Note: We don't throw here to avoid breaking the DB insert
				}
			}
		}

		return plugin;
	} catch (error: unknown) {
		const err = error as { code?: string; message?: string };

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
