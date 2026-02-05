import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	tagAssignmentsTable,
	tagsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import { Tag } from "~/src/graphql/types/Tag/Tag";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// ----------------------
// Zod schema
// ----------------------
const userTagsArgsSchema = z.object({
	userId: z.string().uuid(),
});

// ----------------------
// GraphQL Query
// ----------------------
builder.queryField("userTags", (t) =>
	t.field({
		type: [Tag],
		args: {
			userId: t.arg.id({
				required: true,
				description: "User ID to fetch assigned tags for",
			}),
		},
		description: "Fetch tags assigned to a specific user",
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		resolve: async (_parent, args, ctx) => {
			// ----------------------
			// Auth check
			// ----------------------
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// ----------------------
			// Validate input
			// ----------------------
			const parsed = userTagsArgsSchema.safeParse(args);
			if (!parsed.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsed.error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const { userId } = parsed.data;

			const currentUserId = ctx.currentClient.user.id;
			const targetUserId = parsed.data.userId;

			// Fetch current user to check role
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
				columns: { role: true },
			});

			// Allow access if:
			// 1. User is querying their own tags
			// 2. User is an administrator
			if (
				currentUserId !== targetUserId &&
				currentUser?.role !== "administrator"
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["userId"] }],
					},
				});
			}

			// ----------------------
			// Fetch tags assigned to user
			// ----------------------
			const tags = await ctx.drizzleClient
				.select({
					id: tagsTable.id,
					name: tagsTable.name,
					createdAt: tagsTable.createdAt,
					updatedAt: tagsTable.updatedAt,
					creatorId: tagsTable.creatorId,
					updaterId: tagsTable.updaterId,
					organizationId: tagsTable.organizationId,
					folderId: tagsTable.folderId,
					createdById: usersTable.id,
				})
				.from(tagAssignmentsTable)
				.innerJoin(tagsTable, eq(tagAssignmentsTable.tagId, tagsTable.id))
				.leftJoin(usersTable, eq(usersTable.id, tagsTable.creatorId))
				.where(eq(tagAssignmentsTable.assigneeId, userId));

			return tags;
		},
	}),
);
