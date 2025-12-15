import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	QueryOrganizationPostsInput,
	queryOrganizationPostsInputSchema,
} from "~/src/graphql/inputs/QueryOrganizationPostsInput";
import { Post } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
// pagination utilities removed for array-style endpoint

const queryOrganizationPostsArgumentsSchema = z.object({
	input: queryOrganizationPostsInputSchema,
});

// cursor schema removed for array-style endpoint

builder.queryField("postsByOrganization", (t) =>
	t.field({
		type: [Post],
		args: {
			input: t.arg({
				description: "Input required to query posts of an organization.",
				required: true,
				type: QueryOrganizationPostsInput,
			}),
		},
		description:
			"Query to retrieve all posts belonging to an organization with their attachments.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = queryOrganizationPostsArgumentsSchema.safeParse(args);

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

			const currentUserId = ctx.currentClient.user.id;

			// Verify the organization exists and user has access to it
			const [currentUser, organization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: {
						id: true,
					},
					with: {
						membershipsWhereOrganization: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (organization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				organization.membershipsWhereOrganization[0];

			// Check if user is an administrator or a member of the organization
			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership === undefined
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
				});
			}

			const sortOrder = parsedArgs.input.sortOrder || "DESC";

			const orderBy =
				sortOrder === "ASC"
					? [asc(postsTable.createdAt), asc(postsTable.id)]
					: [desc(postsTable.createdAt), desc(postsTable.id)];

			const posts = await ctx.drizzleClient.query.postsTable.findMany({
				where: eq(postsTable.organizationId, parsedArgs.input.organizationId),
				orderBy,
				with: { attachmentsWherePost: true },
			});

			return posts.map(({ attachmentsWherePost, ...post }) =>
				Object.assign(post, { attachments: attachmentsWherePost }),
			);
		},
	}),
);
