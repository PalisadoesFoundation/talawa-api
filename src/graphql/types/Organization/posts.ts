import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import { z } from "zod";
import { postsTable, postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { Post } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "./Organization";

const postsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

const cursorSchema = z.object({
	id: postsTableInsertSchema.shape.id.unwrap(),
});

Organization.implement({
	fields: (t) => ({
		posts: t.connection(
			{
				description:
					"GraphQL connection to traverse through the posts belonging to the organization.",
				resolve: async (parent, args, ctx) => {
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
					} = postsArgumentsSchema.safeParse(args);

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

					const currentUser =
						await ctx.drizzleClient.query.usersTable.findFirst({
							columns: {
								role: true,
							},
							with: {
								organizationMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.organizationId, parent.id),
								},
							},
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						});

					if (currentUser === undefined) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					const currentUserOrganizationMembership =
						currentUser.organizationMembershipsWhereMember[0];

					if (
						currentUser.role !== "administrator" &&
						currentUserOrganizationMembership === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [asc(postsTable.id)]
						: [desc(postsTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(postsTable)
										.where(
											and(
												eq(postsTable.id, cursor.id),
												eq(postsTable.organizationId, parent.id),
											),
										),
								),
								eq(postsTable.organizationId, parent.id),
								gt(postsTable.id, cursor.id),
							);
						} else {
							where = eq(postsTable.organizationId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(postsTable)
										.where(
											and(
												eq(postsTable.id, cursor.id),
												eq(postsTable.organizationId, parent.id),
											),
										),
								),
								eq(postsTable.organizationId, parent.id),
								lt(postsTable.id, cursor.id),
							);
						} else {
							where = eq(postsTable.organizationId, parent.id);
						}
					}

					const posts = await ctx.drizzleClient.query.postsTable.findMany({
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
				description: "",
			},
			{
				description: "",
			},
		),
	}),
});
