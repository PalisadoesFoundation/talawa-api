import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryOrganizationInput,
	queryOrganizationInputSchema,
} from "~/src/graphql/inputs/QueryOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { OrganizationCustomField } from "~/src/graphql/types/Organization/OrganizationCustomField";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Input schema for the query
const QueryCustomFieldsInput = builder.inputType("QueryCustomFieldsInput", {
	fields: (t) => ({
		organizationId: t.string({
			required: true,
			description: "ID of the organization to fetch custom fields for",
		}),
	}),
});

const queryCustomFieldsInputSchema = z.object({
	organizationId: z.string(),
});

const queryCustomFieldsArgumentsSchema = z.object({
	input: queryCustomFieldsInputSchema,
});

const queryOrganizationArgumentsSchema = z.object({
	input: queryOrganizationInputSchema,
});

builder.queryField("organization", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryOrganizationInput,
			}),
		},
		description: "Query field to read an organization.",
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = queryOrganizationArgumentsSchema.safeParse(args);

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

			const organization =
				await ctx.drizzleClient.query.organizationsTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
				});

			if (organization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return organization;
		},
		type: Organization,
	}),
);

interface QueryCustomFieldsArgs {
	input: {
		organizationId: string;
	};
}

interface ParsedArgs {
	data?: QueryCustomFieldsArgs;
	error?: z.ZodError;
	success: boolean;
}

builder.queryField("customFields", (t) =>
	t.field({
		type: [OrganizationCustomField],
		args: {
			input: t.arg({
				type: QueryCustomFieldsInput,
				required: true,
			}),
		},
		description: "Query to fetch custom fields for an organization",
		resolve: async (_parent, args: QueryCustomFieldsArgs, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			}: ParsedArgs = queryCustomFieldsArgumentsSchema.safeParse(args);

			if (!success && error) {
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

			const customFields =
				await ctx.drizzleClient.query.customFieldsTable.findMany({
					where: (fields, operators) =>
						parsedArgs?.input.organizationId
							? operators.eq(
									fields.organizationId,
									parsedArgs.input.organizationId,
								)
							: undefined,
				});

			if (!customFields.length) {
				return [];
			}

			return customFields;
		},
	}),
);
