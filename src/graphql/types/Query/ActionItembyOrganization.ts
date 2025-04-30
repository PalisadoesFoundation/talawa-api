import { builder } from "~/src/graphql/builder";

import {
	type ParsedDefaultGraphQLConnectionArguments,
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";

import { type SQL, and, asc, desc, eq, gt, lt, or } from "drizzle-orm";

import { actionItemsTable } from "~/src/drizzle/tables/actionItems";

import { queryActionItemsByOrganizationArgumentsSchema } from "~/src/graphql/inputs/QueryActionItemInput";

import { z } from "zod";
import { ActionItem } from "~/src/graphql/types/ActionItem/actionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const cursorSchema = z
	.object({
		createdAt: z.string().datetime(),
		id: z.string().uuid(),
	})
	.transform(({ createdAt, id }) => ({
		createdAt: new Date(createdAt),
		id,
	}));

const ActionItemsConnectionArgsSchema = defaultGraphQLConnectionArgumentsSchema
	.extend({
		/** business arg that was previously wrapped inside `input` */
		organizationId: z.string().uuid(),
	})
	.transform(transformDefaultGraphQLConnectionArguments);

export const actionItemsByOrganization = builder.queryField(
	"actionItemsByOrganization",
	(t) =>
		t.connection(
			{
				type: ActionItem,
				description: "Paginated list of ActionItems for a given organization.",

				args: {
					/* old input object is flattened to keep resolver changes minimal */
					organizationId: t.arg.id({
						required: true,
						description: "ID of the organization whose ActionItems you need",
					}),

					/** Relay connection arguments */
					after: t.arg.string(),
					before: t.arg.string(),
					first: t.arg.int(),
					last: t.arg.int(),
				},

				resolve: async (_p, args, ctx) => {
					/* ── 2-a • auth guard (unchanged) ──────────────────────────── */
					if (!ctx.currentClient.isAuthenticated) {
						throw new TalawaGraphQLError({
							extensions: { code: "unauthenticated" },
						});
					}

					const businessValidation =
						queryActionItemsByOrganizationArgumentsSchema.safeParse({
							input: { organizationId: args.organizationId },
						});

					if (!businessValidation.success) {
						const { error } = businessValidation;
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: error.issues.map((i) => ({
									argumentPath: i.path,
									message: i.message,
								})),
							},
						});
					}

					const parsed = ActionItemsConnectionArgsSchema.safeParse(args);
					if (!parsed.success) {
						const { error } = parsed;
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: error.issues.map((i) => ({
									argumentPath: i.path,
									message: i.message,
								})),
							},
						});
					}
					const parsedArgs = parsed.data;

					let cursor: z.infer<typeof cursorSchema> | undefined;
					if (parsedArgs.cursor !== undefined) {
						cursor = cursorSchema.parse(
							JSON.parse(
								Buffer.from(parsedArgs.cursor as string, "base64url").toString(
									"utf-8",
								),
							),
						);
					}

					const { limit, isInversed, organizationId } =
						parsedArgs as ParsedDefaultGraphQLConnectionArguments<{
							createdAt: Date;
							id: string;
						}> & {
							organizationId: string;
						};

					const currentUserId = ctx.currentClient.user.id;

					const [currentUser, membership] = await Promise.all([
						ctx.drizzleClient.query.usersTable.findFirst({
							columns: { role: true },
							where: (f, op) => op.eq(f.id, currentUserId),
						}),
						ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
							columns: { role: true },
							where: (f, op) =>
								op.and(
									op.eq(f.organizationId, organizationId),
									op.eq(f.memberId, currentUserId),
								),
						}),
					]);

					if (!currentUser) {
						throw new TalawaGraphQLError({
							extensions: { code: "unauthenticated" },
						});
					}

					if (
						currentUser.role !== "administrator" &&
						(!membership || membership.role !== "administrator")
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: [{ argumentPath: ["organizationId"] }],
							},
						});
					}

					const orderBy = isInversed
						? [asc(actionItemsTable.createdAt), asc(actionItemsTable.id)]
						: [desc(actionItemsTable.createdAt), desc(actionItemsTable.id)];

					let whereCond: SQL | undefined = eq(
						actionItemsTable.organizationId,
						organizationId,
					);

					if (cursor) {
						const { createdAt, id } = cursor;

						whereCond = and(
							whereCond,
							isInversed
								? or(
										and(
											eq(actionItemsTable.createdAt, createdAt),
											gt(actionItemsTable.id, id),
										),
										gt(actionItemsTable.createdAt, createdAt),
									)
								: or(
										and(
											eq(actionItemsTable.createdAt, createdAt),
											lt(actionItemsTable.id, id),
										),
										lt(actionItemsTable.createdAt, createdAt),
									),
						);
					}

					const rawItems =
						await ctx.drizzleClient.query.actionItemsTable.findMany({
							limit,
							orderBy,
							where: whereCond,
							with: {
								assignee: true,
								category: true,
								creator: true,
								event: true,
								organization: true,
								updater: true,
							},
						});

					if (cursor && rawItems.length === 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: [isInversed ? "before" : "after"],
									},
								],
							},
						});
					}

					/* ── 2-f • build Relay connection & return ─────────────────── */
					return transformToDefaultGraphQLConnection({
						createCursor: (item) =>
							Buffer.from(
								JSON.stringify({
									createdAt: item.createdAt.toISOString(),
									id: item.id,
								}),
							).toString("base64url"),
						createNode: (item) => item,
						parsedArgs,
						rawNodes: rawItems,
					});
				},

				/* ---------------------------------------------------------------- */
				complexity: (args) => ({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: (args.first ?? args.last ?? 1) + 1,
				}),
			},
			/* edge & node fields cost */
			{
				edgesField: {
					complexity: { field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST },
				},
			},
			{
				nodeField: {
					complexity: { field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST },
				},
			},
		),
);
