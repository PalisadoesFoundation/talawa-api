import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import type { z } from "zod";
import { fundsTable, fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { Fund } from "~/src/graphql/types/Fund/Fund";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "./Organization";

const fundsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = fundsTableInsertSchema.pick({
	name: true,
});

Organization.implement({
	fields: (t) => ({
		funds: t.connection(
			{
				description:
					"GraphQL connection to traverse through the funds belonging to the organization.",
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
					} = fundsArgumentsSchema.safeParse(args);

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
						(currentUserOrganizationMembership === undefined ||
							currentUserOrganizationMembership.role !== "administrator")
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(fundsTable.name)]
						: [asc(fundsTable.name)];

					let where: SQL | undefined;
					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(fundsTable)
										.where(
											and(
												eq(fundsTable.name, cursor.name),
												eq(fundsTable.organizationId, parent.id),
											),
										),
								),
								eq(fundsTable.organizationId, parent.id),
								lt(fundsTable.name, cursor.name),
							);
						} else {
							where = eq(fundsTable.organizationId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(fundsTable)
										.where(
											and(
												eq(fundsTable.name, cursor.name),
												eq(fundsTable.organizationId, parent.id),
											),
										),
								),
								eq(fundsTable.organizationId, parent.id),
								gt(fundsTable.name, cursor.name),
							);
						} else {
							where = eq(fundsTable.organizationId, parent.id);
						}
					}

					const funds = await ctx.drizzleClient.query.fundsTable.findMany({
						limit,
						orderBy,
						where,
					});

					if (cursor !== undefined && funds.length === 0) {
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
						createCursor: (fund) =>
							Buffer.from(
								JSON.stringify({
									name: fund.name,
								}),
							).toString("base64url"),
						createNode: (fund) => fund,
						parsedArgs,
						rawNodes: funds,
					});
				},
				type: Fund,
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
