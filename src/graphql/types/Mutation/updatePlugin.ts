import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { UpdatePluginInput, updatePluginInputSchema } from "../Plugin/inputs";

/**
 * Resolver for updatePlugin mutation
 */
export const updatePluginResolver = async (
	_: unknown,
	args: {
		input: {
			id: string;
			pluginId?: string | null;
			isActivated?: boolean | null;
			isInstalled?: boolean | null;
			backup?: boolean | null;
		};
	},
	ctx: GraphQLContext,
) => {
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
		const existingPlugin = await ctx.drizzleClient.query.pluginsTable.findFirst(
			{
				where: eq(pluginsTable.id, id),
			},
		);

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

	const existingPlugin = await ctx.drizzleClient.query.pluginsTable.findFirst({
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

	if (pluginId && pluginId !== existingPlugin.pluginId) {
		const duplicatePlugin =
			await ctx.drizzleClient.query.pluginsTable.findFirst({
				where: (fields, operators) => operators.eq(fields.pluginId, pluginId),
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
					console.log(`Plugin deactivated successfully: ${targetPluginId}`);
				}
			} catch (error) {
				console.error(
					`Error during plugin ${willBeActivated ? "activation" : "deactivation"}:`,
					error,
				);
				// Note: We don't throw here to avoid breaking the DB update,
				// but in production you might want to rollback the DB change
			}
		}
	}

	return plugin;
};

/**
 * GraphQL Mutation: Updates an existing plugin.
 */
export const updatePlugin = builder.mutationField("updatePlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input parameters to update a plugin.",
				required: true,
				type: UpdatePluginInput,
			}),
		},
		description: "Mutation field to update a plugin.",
		resolve: updatePluginResolver,
		type: Plugin,
	}),
);
