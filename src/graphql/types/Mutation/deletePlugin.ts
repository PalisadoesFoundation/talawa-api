import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { DeletePluginInput, deletePluginInputSchema } from "../Plugin/inputs";

/**
 * GraphQL Mutation: Deletes a plugin.
 */
export const deletePlugin = builder.mutationField("deletePlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input parameters to delete a plugin.",
				required: true,
				type: DeletePluginInput,
			}),
		},
		description: "Mutation field to delete a plugin.",
		resolve: async (_, args, ctx) => {
			const { id } = deletePluginInputSchema.parse(args.input);

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
		type: Plugin,
	}),
);
