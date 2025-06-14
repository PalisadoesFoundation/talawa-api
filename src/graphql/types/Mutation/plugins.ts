import { eq } from "drizzle-orm";
import { z } from "zod";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
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

			const [plugin] = await ctx.drizzleClient
				.insert(pluginsTable)
				.values({
					pluginId,
					isActivated,
					isInstalled,
					backup,
				})
				.returning();

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

			const { id, ...updates } = parsedArgs;

			const [plugin] = await ctx.drizzleClient
				.update(pluginsTable)
				.set(updates)
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
	}),
}));
