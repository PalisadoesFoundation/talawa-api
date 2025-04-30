import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";
import {
	QueryActionCategoriesByOrganizationInput,
	queryActionCategoriesByOrganizationArgumentsSchema,
} from "~/src/graphql/inputs/QueryActionCategoriesByOrganizationInput";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/actionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	type ParsedDefaultGraphQLConnectionArguments,
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import envConfig from "~/src/utilities/graphqLimits";

/* ───────────────────────────────────────── helpers ────────────────────────── */

const cursorSchema = z
	.object({
		createdAt: z.string().datetime(),
		id: z.string().uuid(),
	})
	.transform(({ createdAt, id }) => ({
		createdAt: new Date(createdAt),
		id,
	}));

const connArgsSchema = defaultGraphQLConnectionArgumentsSchema.transform(
	transformDefaultGraphQLConnectionArguments,
);

/* ─────────────────────────────────────── resolver ─────────────────────────── */

export const actionCategoriesByOrganization = builder.queryField(
	"actionCategoriesByOrganization",
	(t) =>
		t.connection(
			{
				type: ActionItemCategory,

				/* ---------- arguments ---------- */
				args: {
					input: t.arg({
						required: true,
						type: QueryActionCategoriesByOrganizationInput,
						description: "Business input – only the organizationId lives here.",
					}),
					/* Relay-connection args live at the same level as `input` */
					after: t.arg.string(),
					before: t.arg.string(),
					first: t.arg.int(),
					last: t.arg.int(),
				},

				description:
					"Paginated action-item categories linked to a specific organization.",

				/* ---------- complexity ---------- */
				complexity: (args) => ({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: (args.first ?? args.last ?? 1) + 1,
				}),

				/* ---------- resolver ---------- */
				resolve: async (_p, args, ctx) => {
					/* 1. auth guard */
					if (!ctx.currentClient.isAuthenticated) {
						throw new TalawaGraphQLError({
							extensions: { code: "unauthenticated" },
						});
					}

					/* 2. business-input validation */
					const businessCheck =
						queryActionCategoriesByOrganizationArgumentsSchema.safeParse(args);
					if (!businessCheck.success) {
						const { error } = businessCheck;
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
					const organizationId = businessCheck.data.input.organizationId;

					/* 3. connection-args validation */
					const connCheck = connArgsSchema.safeParse(args);
					if (!connCheck.success) {
						const { error } = connCheck;
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
					const parsed =
						connCheck.data as ParsedDefaultGraphQLConnectionArguments<{
							createdAt: Date;
							id: string;
						}>;

					/* 4. cursor decode (if supplied) */
					let cursor: z.infer<typeof cursorSchema> | undefined;
					if (parsed.cursor) {
						cursor = cursorSchema.parse(
							JSON.parse(
								Buffer.from(
									(parsed.cursor as unknown as string)
										.replace(/-/g, "+")
										.replace(/_/g, "/"),
									"base64",
								).toString("utf-8"),
							),
						);
					}

					/* 5. authZ – user must be org admin or sys admin */
					const currentUserId = ctx.currentClient.user.id;
					const [me, membership] = await Promise.all([
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

					if (
						!me ||
						(me.role !== "administrator" &&
							(!membership || membership.role !== "administrator"))
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: [{ argumentPath: ["input", "organizationId"] }],
							},
						});
					}

					/* 6. build where & orderBy */
					const base = eq(
						actionItemCategoriesTable.organizationId,
						organizationId,
					);

					const orderBy = parsed.isInversed
						? [
								asc(actionItemCategoriesTable.createdAt),
								asc(actionItemCategoriesTable.id),
							]
						: [
								desc(actionItemCategoriesTable.createdAt),
								desc(actionItemCategoriesTable.id),
							];

					let whereCond: SQL | undefined = base;

					if (cursor) {
						const cmp = parsed.isInversed ? gt : lt;
						const orCmp = parsed.isInversed
							? gt(actionItemCategoriesTable.createdAt, cursor.createdAt)
							: lt(actionItemCategoriesTable.createdAt, cursor.createdAt);

						whereCond = and(
							base,
							exists(
								ctx.drizzleClient
									.select()
									.from(actionItemCategoriesTable)
									.where(
										and(
											eq(actionItemCategoriesTable.createdAt, cursor.createdAt),
											eq(actionItemCategoriesTable.id, cursor.id),
										),
									),
							),
							or(
								and(
									eq(actionItemCategoriesTable.createdAt, cursor.createdAt),
									cmp(actionItemCategoriesTable.id, cursor.id),
								),
								orCmp,
							),
						);
					}

					/* 7. fetch rows */
					const rows =
						await ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
							where: whereCond,
							orderBy,
							limit: parsed.limit,
						});

					if (cursor && rows.length === 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: [parsed.isInversed ? "before" : "after"],
									},
								],
							},
						});
					}

					/* 8. build & return Relay connection */
					return transformToDefaultGraphQLConnection({
						createCursor: (row) =>
							Buffer.from(
								JSON.stringify({
									createdAt: row.createdAt.toISOString(),
									id: row.id,
								}),
							).toString("base64url"),
						createNode: (row) => row,
						parsedArgs: parsed,
						rawNodes: rows,
					});
				},
			},

			/* ---------- edge & node field costs ---------- */
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
