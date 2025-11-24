import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	CreatePluginInput,
	createPluginInputSchema,
} from "../../Plugin/inputs";

builder.mutationField("createPlugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				type: CreatePluginInput,
				required: true,
			}),
		},
		type: Plugin,
		resolve: async (_parent, args, ctx) => {
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

			const { pluginId } = parsedArgs;

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

			// Create plugin record in database with default values
			const [plugin] = await ctx.drizzleClient
				.insert(pluginsTable)
				.values({
					pluginId,
					isActivated: false,
					isInstalled: false,
					backup: false,
				})
				.returning();

			return plugin;
		},
	}),
);
