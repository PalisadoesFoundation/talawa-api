import { eq } from "drizzle-orm";
import { z } from "zod";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { DeletePluginInput } from "../Plugin/inputs";

const deletePluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
});

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
								message: "Plugin not found",
							},
						],
					},
				});
			}

			const [plugin] = await ctx.drizzleClient
				.delete(pluginsTable)
				.where(eq(pluginsTable.id, id))
				.returning();

			return plugin;
		},
		type: Plugin,
	}),
);
