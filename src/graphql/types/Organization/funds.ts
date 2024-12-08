import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import type { z } from "zod";
import { fundsTable, fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { Fund } from "~/src/graphql/types/Fund/Fund";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
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
					"Organization field to read the funds of the organization by traversing through them using a graphql connection.",
				resolve: async (parent, args, ctx) => {
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
							message: "Invalid arguments provided.",
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
							message:
								"No associated resources found for the provided arguments.",
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
