import { builder } from "~/src/graphql/builder";
import { QueryPluginInput } from "~/src/graphql/inputs/QueryPluginInput";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { PluginRef } from "../Plugins/Plugins";
import pluginsData from "../Plugins/pluginData.json" assert { type: "json" };

builder.queryField("getPlugins", (t) =>
	t.field({
		type: [PluginRef],
		description: "Fetch all available plugins",
		resolve: async (_parent, _args, ctx) => {
			try {
				// Check authentication
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				return pluginsData;
			} catch (error) {
				if (error instanceof TalawaGraphQLError) {
					throw error;
				}
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}
		},
	}),
);

// Create a cache based on plugin ID
const pluginCacheById = new Map(
	pluginsData.map((plugin) => [plugin.id, plugin]),
);

// Create a cache based on plugin name (case insensitive)
const pluginCacheByName = new Map(
	pluginsData.map((plugin) => [plugin.pluginName.toLowerCase(), plugin]),
);

builder.queryField("plugin", (t) =>
	t.field({
		type: PluginRef,
		args: {
			input: t.arg({
				type: QueryPluginInput,
				required: true,
			}),
		},
		resolve: async (_parent, { input }, ctx) => {
			try {
				// Check authentication
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Validate input (either ID or pluginName must be provided)
				if (!input.pluginName?.trim() && !input.id?.trim()) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input"],
									message: "Either plugin ID or plugin name must be provided",
								},
							],
						},
					});
				}
				let plugin: (typeof pluginsData)[0] | undefined;

				// Lookup by ID first if provided, otherwise by plugin name
				if (input.id) {
					plugin = pluginCacheById.get(input.id);
				} else if (input.pluginName) {
					plugin = pluginCacheByName.get(input.pluginName.toLowerCase());
				}

				if (!plugin) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input"],
								},
							],
						},
					});
				}

				return plugin;
			} catch (error) {
				if (error instanceof TalawaGraphQLError) {
					throw error;
				}
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}
		},
	}),
);

builder.mutationField("updatePluginStatus", (t) =>
	t.field({
		type: PluginRef,
		description: "Toggle plugin installation status for an organization",
		args: {
			pluginId: t.arg.string({ required: true }),
			orgId: t.arg.string({ required: true }),
		},
		resolve: async (_parent, { pluginId, orgId }, ctx) => {
			try {
				// Check authentication
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Find plugin
				const plugin = pluginCacheById.get(pluginId);
				if (!plugin) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["pluginId"],
								},
							],
						},
					});
				}

				// Check if the org is already in uninstalledOrgs
				const isUninstalled = plugin.uninstalledOrgs.includes(orgId);

				if (isUninstalled) {
					// Remove from uninstalledOrgs (installing the plugin)
					plugin.uninstalledOrgs = plugin.uninstalledOrgs.filter(
						(org) => org !== orgId,
					);
				} else {
					// Add to uninstalledOrgs (uninstalling the plugin)
					plugin.uninstalledOrgs.push(orgId);
				}

				// Update cache
				pluginCacheById.set(pluginId, plugin);

				return plugin;
			} catch (error) {
				if (error instanceof TalawaGraphQLError) {
					throw error;
				}
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}
		},
	}),
);
