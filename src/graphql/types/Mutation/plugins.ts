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
	}),
}));
