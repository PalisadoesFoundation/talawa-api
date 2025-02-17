import { z } from "zod";
import { customFieldsTable } from "~/src/drizzle/tables/customFields";
import { builder } from "~/src/graphql/builder";
import { OrganizationCustomField } from "~/src/graphql/types/Organization/OrganizationCustomField";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationRemoveCustomFieldArgumentsSchema = z.object({
	id: z.string().nonempty(),
});

builder.mutationField("removeOrganizationCustomField", (t) =>
	t.field({
		args: {
			id: t.arg.string({ required: true }),
		},
		type: OrganizationCustomField,
		resolve: async (_parent, args, ctx) => {
			const { id } = args;

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

			const [deletedCustomField] = await ctx.drizzleClient
				.delete(customFieldsTable)
				.where((fields, operators) => operators.eq(fields.id, id))
				.returning();

			if (deletedCustomField === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedCustomField;
		},
	}),
);
