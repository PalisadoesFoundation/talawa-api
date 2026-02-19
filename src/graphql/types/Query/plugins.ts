import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryPluginInput,
	QueryPluginsInput,
	queryPluginInputSchema,
	queryPluginsInputSchema,
} from "../Plugin/inputs";

/**
 * Resolver for getPluginById
 */
export const getPluginByIdResolver = async (
	_: unknown,
	args: { input: { id: string } },
	ctx: GraphQLContext,
) => {
	const { data: parsedArgs, error, success } = queryPluginInputSchema.safeParse(args.input);

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

	const plugin = await ctx.drizzleClient.query.pluginsTable.findFirst({
		where: eq(pluginsTable.id, parsedArgs.id),
	});
	return plugin;
};

/**
 * GraphQL Query: Fetches a single plugin by ID.
 */
export const getPluginById = builder.queryField("getPluginById", (t) =>
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
		resolve: getPluginByIdResolver,
		type: Plugin,
	}),
);

/**
 * Resolver for getPlugins
 */
export const getPluginsResolver = async (
	_: unknown,
	args: {
		input?: {
			pluginId?: string | null;
			isActivated?: boolean | null;
			isInstalled?: boolean | null;
		} | null;
	},
	ctx: GraphQLContext,
) => {
	const { pluginId, isActivated, isInstalled } = queryPluginsInputSchema.parse(
		args.input ?? {},
	);
	const plugins = await ctx.drizzleClient.query.pluginsTable.findMany({
		where: (fields, operators) => {
			const conditions = [];
			if (pluginId) conditions.push(operators.eq(fields.pluginId, pluginId));
			if (isActivated !== undefined)
				conditions.push(operators.eq(fields.isActivated, isActivated));
			if (isInstalled !== undefined)
				conditions.push(operators.eq(fields.isInstalled, isInstalled));
			return conditions.length > 0 ? operators.and(...conditions) : undefined;
		},
	});
	return plugins;
};

/**
 * GraphQL Query: Fetches multiple plugins with optional filtering.
 */
export const getPlugins = builder.queryField("getPlugins", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input parameters to fetch plugins with optional filtering.",
				required: false,
				type: QueryPluginsInput,
			}),
		},
		description:
			"Query field to fetch multiple plugins with optional filtering.",
		resolve: getPluginsResolver,
		type: [Plugin],
	}),
);
