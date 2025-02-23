import type { InferSelectModel } from "drizzle-orm";
import type { organizationsTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import {
	QueryOrganizationInput,
	queryOrganizationInputSchema,
} from "~/src/graphql/inputs/QueryOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Define type for organization model
type OrganizationType = InferSelectModel<typeof organizationsTable>;
export const organizationsTableQueryResolver = async (_parent: unknown, args: { input?: any }, ctx: any) => {
	try {
		if (args.input) {
			const {
				data: parsedInput,
				error,
				success,
			} = queryOrganizationInputSchema.safeParse(args.input);

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

			if (parsedInput?.id) {
				const organization =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields: any, operators: any) =>
							operators.eq(fields.id, parsedInput.id),
					});

				if (!organization) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "id"] }],
						},
					});
				}

				return [organization];
			}
		}

		return await ctx.drizzleClient.query.organizationsTable.findMany({
			limit: 20,
		});
	} catch (error) {
		console.error("Error in organizations query:", error);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}
};

builder.queryField("organizations", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Filter organizations by ID or order",
				required: false,
				type: QueryOrganizationInput,
			}),
		},
		description: `Query field to read organizations. 
		Returns a single organization when ID is provided, 
		otherwise returns up to 20 organizations. 
		Optional filtering available through input argument.`,

		resolve: async (_parent, args, ctx): Promise<OrganizationType[]> => {
			try {
				// Validate input
				if (args.input) {
					const {
						data: parsedInput,
						error,
						success,
					} = queryOrganizationInputSchema.safeParse(args.input);

					// Handle validation errors
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

					// If an ID is provided, fetch that specific organization
					if (parsedInput?.id) {
						const organization =
							await ctx.drizzleClient.query.organizationsTable.findFirst({
								where: (fields, operators) =>
									operators.eq(fields.id, parsedInput.id),
							});

						// If organization not found, throw error
						if (!organization) {
							throw new TalawaGraphQLError({
								extensions: {
									code: "arguments_associated_resources_not_found",  
									issues: [{ argumentPath: ["input", "id"] }],
								},
							});
						}

						// Return the found organization as an array
						return [organization];
					}
				}

				// Default: Fetch all organizations (limit 20)
				return await ctx.drizzleClient.query.organizationsTable.findMany({
					limit: 20,
				});
			} catch (error) {
				// Optional: Log the error for debugging
				console.error("Error in organizations query:", error);

				// Throw a generic error message
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}
		},
		type: [Organization],
	}),
);
