import { customFieldsTable } from "~/src/drizzle/tables/customFields";
// import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { OrganizationCustomField } from "~/src/graphql/types/Organization/OrganizationCustomField";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.mutationField("addOrganizationCustomField", (t) =>
	t.field({
		args: {
			organizationId: t.arg.string({ required: true }),
			name: t.arg.string({ required: true }),
			type: t.arg.string({ required: true }),
		},
		type: OrganizationCustomField,
		resolve: async (_parent, args, ctx) => {
			const { organizationId, name, type } = args;

			if (!ctx.currentClient.user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}
			const currentUserId = ctx.currentClient.user.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const [createdCustomField] = await ctx.drizzleClient
				.insert(customFieldsTable)
				.values({
					organizationId,
					name,
					type,
				})
				.returning();
			console.log(createdCustomField);
			if (createdCustomField === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdCustomField;
		},
	}),
);
