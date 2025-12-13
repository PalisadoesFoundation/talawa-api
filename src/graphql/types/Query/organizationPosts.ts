import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { postsTable, postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	QueryOrganizationPostsInput,
	queryOrganizationPostsInputSchema,
} from "~/src/graphql/inputs/QueryOrganizationPostsInput";
import { Post } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import envConfig from "~/src/utilities/graphqLimits";

const queryOrganizationPostsArgumentsSchema = z
	.object({
		input: queryOrganizationPostsInputSchema,
	})
	.and(defaultGraphQLConnectionArgumentsSchema)
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursor: z.infer<typeof cursorSchema> | undefined = undefined;

		try {
			if (arg.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (error) {
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [arg.isInversed ? "before" : "after"],
			});
		}

		return {
			cursor,
			input: arg.input,
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

const cursorSchema = z.object({
	createdAt: postsTableInsertSchema.shape.createdAt.unwrap(),
	id: postsTableInsertSchema.shape.id.unwrap(),
});

builder.queryField("organizationPosts", (t) =>
	t.connection(
		{
			args: {
				input: t.arg({
					description: "Input required to query posts of an organization.",
					required: true,
					type: QueryOrganizationPostsInput,
				}),
			},
			complexity: (args) => {
				return {
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: args.first || args.last || 1,
				};
			},
			description:
				"GraphQL connection query to retrieve all posts belonging to an organization with their attachments.",
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
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
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

			const { cursor, isInversed, limit } = parsedArgs;

			const orderBy = isInversed
				? [asc(postsTable.createdAt), asc(postsTable.id)]
				: [desc(postsTable.createdAt), desc(postsTable.id)];

			let where: SQL | undefined;

			// Dynamic comparison operators based on direction
			const createdAtComparator = isInversed ? gt : lt;
			const idComparator = isInversed ? gt : lt;

			if (cursor !== undefined) {
				where = and(
					exists(
						ctx.drizzleClient
							.select()
							.from(postsTable)
							.where(
								and(
									eq(postsTable.id, cursor.id),
									eq(
										postsTable.organizationId,
										parsedArgs.input.organizationId,
									),
								),
							),
					),
					eq(postsTable.organizationId, parsedArgs.input.organizationId),
					or(
						createdAtComparator(postsTable.createdAt, cursor.createdAt),
						and(
							eq(postsTable.createdAt, cursor.createdAt),
							idComparator(postsTable.id, cursor.id),
						),
					),
				);
			} else {
				where = eq(
					postsTable.organizationId,
					parsedArgs.input.organizationId,
				);
			}				const posts = await ctx.drizzleClient.query.postsTable.findMany({
					limit,
					orderBy,
					with: {
						attachmentsWherePost: true,
					},
					where,
				});

				if (cursor !== undefined && posts.length === 0) {
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

				return transformToDefaultGraphQLConnection({
					createCursor: (post) =>
						Buffer.from(
							JSON.stringify({
								createdAt: post.createdAt,
								id: post.id,
							}),
						).toString("base64url"),
					createNode: ({ attachmentsWherePost, ...post }) =>
						Object.assign(post, {
							attachments: attachmentsWherePost,
						}),
					parsedArgs,
					rawNodes: posts,
				});
			},
			type: Post,
		},
		{
			edgesField: {
				complexity: {
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: 1,
				},
			},
			description: "Array of edges containing post nodes.",
		},
		{
			nodeField: {
				complexity: {
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: 1,
				},
			},
			description: "Post node.",
		},
	),
);
