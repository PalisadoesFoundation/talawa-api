import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import {
	organizationMembershipsTable,
	organizationMembershipsTableInsertSchema,
} from "~/src/drizzle/tables/organizationMemberships";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { User } from "./User";

const organizationsMemberOfArgumentsSchema =
	defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = organizationMembershipsTableInsertSchema
	.pick({
		organizationId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		organizationId: arg.organizationId,
	}));

User.implement({
	fields: (t) => ({
		organizationsMemberOf: t.connection(
			{
				description:
					"User field to read the organizations the user is a member of by traversing through them using a graphql connection.",
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = organizationsMemberOfArgumentsSchema.safeParse(args);

					if (!success) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: error.issues.map((issue) => ({
									argumentPath: issue.path,
									message: issue.message,
								})),
							},
							message: "Invalid arguments provided.",
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [
								asc(organizationMembershipsTable.createdAt),
								asc(organizationMembershipsTable.memberId),
								asc(organizationMembershipsTable.organizationId),
							]
						: [
								desc(organizationMembershipsTable.createdAt),
								desc(organizationMembershipsTable.memberId),
								desc(organizationMembershipsTable.organizationId),
							];

					let where: SQL | undefined;
					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(organizationMembershipsTable)
										.where(
											and(
												eq(organizationMembershipsTable.memberId, parent.id),
												eq(
													organizationMembershipsTable.organizationId,
													cursor.organizationId,
												),
											),
										),
								),
								eq(organizationMembershipsTable.memberId, parent.id),
								or(
									and(
										eq(
											organizationMembershipsTable.createdAt,
											cursor.createdAt,
										),
										gt(
											organizationMembershipsTable.organizationId,
											cursor.organizationId,
										),
									),
									gt(organizationMembershipsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(organizationMembershipsTable.memberId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(organizationMembershipsTable)
										.where(
											and(
												eq(organizationMembershipsTable.memberId, parent.id),
												eq(
													organizationMembershipsTable.memberId,
													cursor.organizationId,
												),
											),
										),
								),
								eq(organizationMembershipsTable.organizationId, parent.id),
								or(
									and(
										eq(
											organizationMembershipsTable.createdAt,
											cursor.createdAt,
										),
										lt(
											organizationMembershipsTable.organizationId,
											cursor.organizationId,
										),
									),
									lt(organizationMembershipsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(organizationMembershipsTable.memberId, parent.id);
						}
					}

					const organizationMemberships =
						await ctx.drizzleClient.query.organizationMembershipsTable.findMany(
							{
								columns: {
									createdAt: true,
									organizationId: true,
								},
								limit,
								orderBy,
								with: {
									organization: true,
								},
								where,
							},
						);

					if (cursor !== undefined && organizationMemberships.length === 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: [isInversed ? "before" : "after"],
									},
								],
							},
							message:
								"No associated resources found for the provided arguments.",
						});
					}

					return transformToDefaultGraphQLConnection({
						createCursor: (organizationMembership) =>
							Buffer.from(
								JSON.stringify({
									createdAt: organizationMembership.createdAt,
									organizationId: organizationMembership.organizationId,
								}),
							).toString("base64url"),
						createNode: (organizationMembership) =>
							organizationMembership.organization,
						parsedArgs,
						rawNodes: organizationMemberships,
					});
				},
				type: Organization,
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
