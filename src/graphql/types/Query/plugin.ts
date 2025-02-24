import { builder } from "~/src/graphql/builder";
import { QueryPluginInput } from "~/src/graphql/inputs/QueryPluginInput";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { PluginRef } from "../Plugins/Plugins";
import pluginsData from "../Plugins/pluginData.json" assert { type: "json" };

builder.queryField("plugins", (t) =>
	t.field({
		type: [PluginRef],
		args: {
			after: t.arg.string(),
			before: t.arg.string(),
			first: t.arg.int(),
			last: t.arg.int(),
		},
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

const pluginCache = new Map(
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
				// Validate input
				if (!input.pluginName?.trim()) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "pluginName"],
									message: "Plugin name cannot be empty",
								},
							],
						},
					});
				}

				const plugin = pluginCache.get(input.pluginName.toLowerCase());

				if (!plugin) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "pluginName"],
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
