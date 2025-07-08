import { eq } from "drizzle-orm";
import { z } from "zod";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	CreatePluginInput,
	DeletePluginInput,
	UpdatePluginInput,
} from "../Plugin/inputs";

const createPluginInputSchema = z.object({
	pluginId: z.string(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

const updatePluginInputSchema = z.object({
	id: z.string().uuid(),
	pluginId: z.string().optional(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

const deletePluginInputSchema = z.object({
	id: z.string().uuid(),
});

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

			const [plugin] = await ctx.drizzleClient
				.insert(pluginsTable)
				.values({
					pluginId,
					isActivated,
					isInstalled,
					backup,
				})
				.returning();

			// Handle automatic plugin activation if requested
			if (isActivated) {
				const pluginManager = getPluginManagerInstance();
				if (pluginManager) {
					try {
						// Load plugin if not already loaded
						if (!pluginManager.isPluginLoaded(pluginId)) {
							const loaded = await pluginManager.loadPlugin(pluginId);
							if (!loaded) {
								throw new Error(`Failed to load plugin: ${pluginId}`);
							}
						}

						// Activate plugin (registers GraphQL extensions, etc.)
						const activated = await pluginManager.activatePlugin(pluginId);
						if (!activated) {
							throw new Error(`Failed to activate plugin: ${pluginId}`);
						}
					} catch (error) {
						// If activation fails, we still return the created plugin record
						// but log the error - the user can try to activate it again later
						console.error(`Plugin activation failed for ${pluginId}:`, error);
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
			const {
				data: parsedArgs,
				error,
				success,
			} = updatePluginInputSchema.safeParse(args.input);

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

			const { id, ...rawUpdates } = parsedArgs;
			const updates = Object.fromEntries(
				Object.entries(rawUpdates).filter(([, v]) => v !== undefined),
			);

			// Get current plugin state before update
			const currentPlugin =
				await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.id, id),
				});

			if (!currentPlugin) {
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

			// Check for duplicate pluginId if pluginId is being updated
			if ("pluginId" in updates && typeof updates.pluginId === "string") {
				const existing = await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.pluginId, updates.pluginId),
				});
				if (existing && existing.id !== id) {
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

			// Handle plugin activation/deactivation dynamically
			const pluginManager = getPluginManagerInstance();
			if (pluginManager && "isActivated" in updates) {
				const isBeingActivated =
					updates.isActivated === true && !currentPlugin.isActivated;
				const isBeingDeactivated =
					updates.isActivated === false && currentPlugin.isActivated;

				try {
					if (isBeingActivated) {
						// Load plugin if not already loaded
						if (!pluginManager.isPluginLoaded(currentPlugin.pluginId)) {
							const loaded = await pluginManager.loadPlugin(
								currentPlugin.pluginId,
							);
							if (!loaded) {
								throw new Error(
									`Failed to load plugin: ${currentPlugin.pluginId}`,
								);
							}
						}

						// Activate plugin (registers GraphQL extensions, etc.)
						const activated = await pluginManager.activatePlugin(
							currentPlugin.pluginId,
						);
						if (!activated) {
							throw new Error(
								`Failed to activate plugin: ${currentPlugin.pluginId}`,
							);
						}
					} else if (isBeingDeactivated) {
						// Deactivate plugin (but don't drop tables by default to preserve data)
						const deactivated = await pluginManager.deactivatePlugin(
							currentPlugin.pluginId,
							false,
						);
						if (!deactivated) {
							throw new Error(
								`Failed to deactivate plugin: ${currentPlugin.pluginId}`,
							);
						}
					}
				} catch (error) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
							issues: [
								{
									argumentPath: ["input", "isActivated"],
									message: `Plugin operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
								},
							],
						},
					});
				}
			}

			// Update database record
			const [plugin] = await ctx.drizzleClient
				.update(pluginsTable)
				.set(updates) // only concrete values
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

	deletePlugin: t.field({
		type: Plugin,
		args: {
			input: t.arg({ type: DeletePluginInput, required: true }),
		},
		resolve: async (_, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = deletePluginInputSchema.safeParse(args.input);

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

			const { id } = parsedArgs;

			// Get plugin info before deletion
			const pluginToDelete =
				await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.id, id),
				});

			if (!pluginToDelete) {
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

			// Handle plugin cleanup before deletion
			const pluginManager = getPluginManagerInstance();
			if (pluginManager?.isPluginLoaded(pluginToDelete.pluginId)) {
				try {
					// Deactivate and unload the plugin (optionally drop tables - set to true if you want to remove all data)
					if (pluginManager.isPluginActive(pluginToDelete.pluginId)) {
						await pluginManager.deactivatePlugin(pluginToDelete.pluginId, true); // true = drop tables
					}
					await pluginManager.unloadPlugin(pluginToDelete.pluginId);
				} catch (error) {
					console.error(
						`Plugin cleanup failed for ${pluginToDelete.pluginId}:`,
						error,
					);
					// Continue with deletion even if cleanup fails
				}
			}

			// Explicit cleanup of plugin dependencies before deletion
			// This ensures data integrity even if foreign key constraints are not set up
			// or if we need to handle cleanup in a specific order

			// TODO: Uncomment and implement when these tables are created
			// await ctx.drizzleClient
			//   .delete(pluginLogsTable)
			//   .where(eq(pluginLogsTable.pluginId, id));
			//
			// await ctx.drizzleClient
			//   .delete(pluginBackupsTable)
			//   .where(eq(pluginBackupsTable.pluginId, id));
			//
			// await ctx.drizzleClient
			//   .delete(pluginACLsTable)
			//   .where(eq(pluginACLsTable.pluginId, id));

			const [plugin] = await ctx.drizzleClient
				.delete(pluginsTable)
				.where(eq(pluginsTable.id, id))
				.returning();

			return plugin;
		},
	}),
}));
