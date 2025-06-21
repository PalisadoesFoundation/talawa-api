import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { CreatePluginInput, createPluginInputSchema } from "../Plugin/inputs";

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
		resolve: async (_, args, ctx) => {
			const { pluginId, isActivated, isInstalled, backup } =
				createPluginInputSchema.parse(args.input);

			try {
				const [plugin] = await ctx.drizzleClient
					.insert(pluginsTable)
					.values({
						pluginId,
						isActivated: isActivated ?? false,
						isInstalled: isInstalled ?? true,
						backup: backup ?? false,
					})
					.returning();

				return plugin;
			} catch (error) {
				// Check if this is a unique constraint violation on plugin_id
				if (error instanceof Error && error.message.includes("23505")) {
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
		},
		type: Plugin,
	}),
);
