import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	UpdatePluginInput,
	updatePluginInputSchema,
} from "../../Plugin/inputs";

builder.mutationField("updatePlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				type: UpdatePluginInput,
				required: true,
			}),
		},
		type: Plugin,
		resolve: async (_parent, args, ctx) => {
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
								ctx.log.info({ pluginId: targetPluginId }, "Activating plugin");

								// Load plugin if not already loaded
								if (!pluginManager.isPluginLoaded(targetPluginId)) {
									await pluginManager.loadPlugin(targetPluginId);
								}

								// Activate the plugin (registers GraphQL, etc.)
								await pluginManager.activatePlugin(targetPluginId);

								ctx.log.info(
									{ pluginId: targetPluginId },
									"Plugin activated successfully",
								);
							} else {
								// Plugin is being deactivated
								ctx.log.info(
									{ pluginId: targetPluginId },
									"Deactivating plugin",
								);
								await pluginManager.deactivatePlugin(targetPluginId);
								ctx.log.info(
									{ pluginId: targetPluginId },
									"Plugin deactivated successfully",
								);
							}
						} catch (error) {
							ctx.log.error(
								{ pluginId: targetPluginId, err: error },
								`Error during plugin ${willBeActivated ? "activation" : "deactivation"}`,
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
);
