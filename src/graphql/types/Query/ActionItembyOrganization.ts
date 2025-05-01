import { builder } from "~/src/graphql/builder";

// Utility functions and types for standardized pagination (Relay spec style)
import {
	type ParsedDefaultGraphQLConnectionArguments,
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";

import { type SQL, and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";

import { z } from "zod";
import { queryActionItemsByOrganizationArgumentsSchema } from "~/src/graphql/inputs/QueryActionItemInput";

import { ActionItem } from "~/src/graphql/types/ActionItem/actionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

// Schema for decoding the pagination cursor
const cursorSchema = z
	.object({
		createdAt: z.string().datetime(), // Date when the item was created
		id: z.string().uuid(), // Unique ID of the item
	})
	.transform(({ createdAt, id }) => ({
		createdAt: new Date(createdAt), // Convert date string to Date object
		id,
	}));

// Combine pagination arguments with business logic args
const ActionItemsConnectionArgsSchema = defaultGraphQLConnectionArgumentsSchema
	.extend({
		// Business-specific argument (organization scoping)
		organizationId: z.string().uuid(),
	})
	.transform(transformDefaultGraphQLConnectionArguments);

// GraphQL query to get action items by organization in a paginated format
export const actionItemsByOrganization = builder.queryField(
	"actionItemsByOrganization",
	(t) =>
		t.connection(
			{
				type: ActionItem,
				description: "Paginated list of ActionItems for a given organization.",
				args: {
					// Business argument
					organizationId: t.arg.id({
						required: true,
						description: "ID of the organization whose ActionItems you need",
					}),
					// Relay pagination arguments
					after: t.arg.string(),
					before: t.arg.string(),
					first: t.arg.int(),
					last: t.arg.int(),
				},
				resolve: async (_p, args, ctx) => {
					// ── Step 1: Authentication check ──
					if (!ctx.currentClient.isAuthenticated) {
						throw new TalawaGraphQLError({
							extensions: { code: "unauthenticated" },
						});
					}

					// ── Step 2: Validate the business input ──
					const businessValidation =
						queryActionItemsByOrganizationArgumentsSchema.safeParse({
							input: { organizationId: args.organizationId },
						});
					if (!businessValidation.success) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: businessValidation.error.issues.map((i) => ({
									argumentPath: i.path,
									message: i.message,
								})),
							},
						});
					}

					// ── Step 3: Validate pagination + business args ──
					const parsed = ActionItemsConnectionArgsSchema.safeParse(args);
					if (!parsed.success) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: parsed.error.issues.map((i) => ({
									argumentPath: i.path,
									message: i.message,
								})),
							},
						});
					}
					const parsedArgs = parsed.data;

					// ── Step 4: Decode cursor if provided ──
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

					// ── Step 5: Destructure key values from parsed args ──
					const { limit, isInversed, organizationId } =
						parsedArgs as ParsedDefaultGraphQLConnectionArguments<{
							createdAt: Date;
							id: string;
						}> & {
							organizationId: string;
						};

					const currentUserId = ctx.currentClient.user.id;

					// ── Step 6: Fetch user and org membership ──
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

					// ── Step 7: Authorization check ──
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

					// ── Step 8: Setup ordering and filtering ──
					const orderBy = isInversed
						? [asc(actionItemsTable.createdAt), asc(actionItemsTable.id)]
						: [desc(actionItemsTable.createdAt), desc(actionItemsTable.id)];

					let whereCond: SQL | undefined = eq(
						actionItemsTable.organizationId,
						organizationId,
					);

					// ── Step 9: Handle pagination cursor logic ──
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

					// ── Step 10: Fetch filtered action items ──
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

					// ── Step 11: Error if cursor was invalid ──
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

					// ── Step 12: Build and return a Relay-compliant connection ──
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

				// ── GraphQL Cost Complexity ──
				complexity: (args) => ({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: (args.first ?? args.last ?? 1) + 1,
				}),
			},
			// Edge and node cost complexity definitions
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
