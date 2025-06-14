import { eq } from "drizzle-orm";
import { z } from "zod";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { UpdatePluginInput } from "../Plugin/inputs";

const updatePluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
	pluginId: z.string().optional(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

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
		resolve: async (_, args, ctx) => {
			const { id, pluginId, isActivated, isInstalled, backup } =
				updatePluginInputSchema.parse(args.input);

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

			if (pluginId && pluginId !== existingPlugin.pluginId) {
				const duplicatePlugin =
					await ctx.drizzleClient.query.pluginsTable.findFirst({
						where: (plugin, { eq }) => eq(plugin.pluginId, pluginId),
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

			return plugin;
		},
		type: Plugin,
	}),
);
