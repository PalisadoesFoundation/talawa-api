import { customFieldsTable } from "~/src/drizzle/tables/customFields";
import { builder } from "~/src/graphql/builder";
import { OrganizationCustomField } from "~/src/graphql/types/Organization/OrganizationCustomField";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Define valid custom field types
const VALID_CUSTOM_FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "BOOLEAN"];

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

			// Authentication check
			if (!ctx.currentClient.user) {
				throw new TalawaGraphQLError({
					message: "User must be authenticated",
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Input validation
			if (!name.trim()) {
				throw new TalawaGraphQLError({
					message: "Name cannot be empty",
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["name"],
								message: "Name cannot be empty",
							},
						],
					},
				});
			}

			if (!VALID_CUSTOM_FIELD_TYPES.includes(type.toUpperCase())) {
				throw new TalawaGraphQLError({
					message: `Invalid field type. Must be one of: ${VALID_CUSTOM_FIELD_TYPES.join(", ")}`,
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["type"],
								message: `Invalid field type. Must be one of: ${VALID_CUSTOM_FIELD_TYPES.join(", ")}`,
							},
						],
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// Check if organization exists
			const organization =
				await ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: {
						id: true,
					},
					where: (fields, operators) => operators.eq(fields.id, organizationId),
				});

			if (!organization) {
				throw new TalawaGraphQLError({
					message: "Organization not found",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["organizationId"],
							},
						],
					},
				});
			}

			// Check user authorization
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					message: "User not found",
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Check if custom field with same name already exists
			const existingField =
				await ctx.drizzleClient.query.customFieldsTable.findFirst({
					columns: {
						id: true,
					},
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.organizationId, organizationId),
							operators.eq(fields.name, name),
						),
				});

			if (existingField) {
				throw new TalawaGraphQLError({
					message: "Custom field with this name already exists",
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["name"],
								message:
									"A custom field with this name already exists in the organization",
							},
						],
					},
				});
			}

			try {
				const [createdCustomField] = await ctx.drizzleClient
					.insert(customFieldsTable)
					.values({
						organizationId,
						name: name.trim(),
						type: type.toUpperCase(),
					})
					.returning();

				if (!createdCustomField) {
					throw new TalawaGraphQLError({
						message: "Failed to create custom field",
						extensions: {
							code: "unexpected",
						},
					});
				}

				return createdCustomField;
			} catch (error) {
				throw new TalawaGraphQLError({
					message: "Database error occurred",
					extensions: {
						code: "unexpected",
						cause: error instanceof Error ? error.message : "Unknown error",
					},
				});
			}
		},
	}),
);
