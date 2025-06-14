import { z } from "zod";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { CreatePluginInput } from "../Plugin/inputs";

const createPluginInputSchema = z.object({
	pluginId: z.string(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

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

			const existingPlugin =
				await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: (plugin, { eq }) => eq(plugin.pluginId, pluginId),
				});

			if (existingPlugin) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_already_exist",
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
					isActivated: isActivated ?? false,
					isInstalled: isInstalled ?? true,
					backup: backup ?? false,
				})
				.returning();

			return plugin;
		},
		type: Plugin,
	}),
);
