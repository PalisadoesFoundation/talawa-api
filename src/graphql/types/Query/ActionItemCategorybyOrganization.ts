// Import SQL operators and helpers from Drizzle ORM
import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";

// Import GraphQL input schema and validation
import {
	QueryActionCategoriesByOrganizationInput,
	queryActionCategoriesByOrganizationArgumentsSchema,
} from "~/src/graphql/inputs/QueryActionCategoriesByOrganizationInput";

import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/actionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Import Relay-style connection utilities
import {
	type ParsedDefaultGraphQLConnectionArguments,
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";

import envConfig from "~/src/utilities/graphqLimits";

/* ──────────────────────── Cursor schema for pagination ─────────────────────── */
// Defines the structure and transformation for decoding pagination cursors
const cursorSchema = z
	.object({
		createdAt: z.string().datetime(), // Timestamp of the item
		id: z.string().uuid(), // UUID of the item
	})
	.transform(({ createdAt, id }) => ({
		createdAt: new Date(createdAt),
		id,
	}));

// Transforms the default connection args into parsed relay-compatible format
const connArgsSchema = defaultGraphQLConnectionArgumentsSchema.transform(
	transformDefaultGraphQLConnectionArguments,
);

/* ───────────────────────────── GraphQL Resolver ────────────────────────────── */
// Define the GraphQL query field for paginated category list by organization
export const actionCategoriesByOrganization = builder.queryField(
	"actionCategoriesByOrganization",
	(t) =>
		t.connection(
			{
				type: ActionItemCategory, // Relay node type

				// ── GraphQL arguments ──
				args: {
					input: t.arg({
						required: true,
						type: QueryActionCategoriesByOrganizationInput,
						description: "Business input – only the organizationId lives here.",
					}),
					after: t.arg.string(), // Relay pagination: cursor after
					before: t.arg.string(), // Relay pagination: cursor before
					first: t.arg.int(), // Relay pagination: forward limit
					last: t.arg.int(), // Relay pagination: backward limit
				},

				description:
					"Paginated action-item categories linked to a specific organization.",

				// ── Field complexity cost for query planning ──
				complexity: (args) => ({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: (args.first ?? args.last ?? 1) + 1,
				}),

				// ── Core resolver function ──
				resolve: async (_p, args, ctx) => {
					// Step 1: Authentication check
					if (!ctx.currentClient.isAuthenticated) {
						throw new TalawaGraphQLError({
							extensions: { code: "unauthenticated" },
						});
					}

					// Step 2: Business input validation
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

					// Step 3: Pagination input validation
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

					// Step 4: Decode pagination cursor (if present)
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

					// Step 5: Authorization - user must be org admin or sys admin
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

					// Step 6: Build filtering conditions & ordering
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

						// Include cursor-aware pagination logic
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

					// Step 7: Execute the query to fetch paginated rows
					const rows =
						await ctx.drizzleClient.query.actionItemCategoriesTable.findMany({
							where: whereCond,
							orderBy,
							limit: parsed.limit,
						});

					// Step 8: Validate that cursor wasn't stale (optional fail-safe)
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

					// Step 9: Build and return the Relay-style connection object
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

			// ── Relay cost complexity for edges and nodes ──
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
