import { eq } from "drizzle-orm";
import { z } from "zod";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { QueryPluginInput, QueryPluginsInput } from "../Plugin/inputs";

const queryPluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
});

const queryPluginsInputSchema = z.object({
	pluginId: z.string().optional(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
});

/**
 * GraphQL Query: Fetches a single plugin by ID.
 */
export const plugin = builder.queryField("plugin", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input parameters to fetch a plugin by ID.",
				required: true,
				type: QueryPluginInput,
			}),
		},
		description: "Query field to fetch a single plugin by ID.",
		nullable: true,
		resolve: async (_, args, ctx) => {
			const { id } = queryPluginInputSchema.parse(args.input);

			const plugin = await ctx.drizzleClient.query.pluginsTable.findFirst({
				where: eq(pluginsTable.id, id),
			});

			return plugin;
		},
		type: Plugin,
	}),
);

/**
 * GraphQL Query: Fetches multiple plugins with optional filtering.
 */
export const plugins = builder.queryField("plugins", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input parameters to fetch plugins with optional filtering.",
				required: true,
				type: QueryPluginsInput,
			}),
		},
		description:
			"Query field to fetch multiple plugins with optional filtering.",
		resolve: async (_, args, ctx) => {
			const { pluginId, isActivated, isInstalled } =
				queryPluginsInputSchema.parse(args.input);

			const plugins = await ctx.drizzleClient.query.pluginsTable.findMany({
				where: (plugin, { and, eq }) => {
					const conditions = [];
					if (pluginId) conditions.push(eq(plugin.pluginId, pluginId));
					if (isActivated !== undefined)
						conditions.push(eq(plugin.isActivated, isActivated));
					if (isInstalled !== undefined)
						conditions.push(eq(plugin.isInstalled, isInstalled));
					return conditions.length > 0 ? and(...conditions) : undefined;
				},
			});

			return plugins;
		},
		type: [Plugin],
	}),
);
