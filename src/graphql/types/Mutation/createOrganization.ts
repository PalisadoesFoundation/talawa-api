import { z } from "zod";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateOrganizationInput,
	mutationCreateOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationCreateOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { runBestEffortInvalidation } from "~/src/graphql/utils/runBestEffortInvalidation";
import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";
import { invalidateEntityLists } from "~/src/services/caching/invalidation";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateOrganizationArgumentsSchema = z.object({
	input: mutationCreateOrganizationInputSchema,
});

builder.mutationField("createOrganization", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateOrganizationInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an organization.",
		resolve: withMutationMetrics(
			{
				operationName: "mutation:createOrganization",
			},
			async (_parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user?.id;
				if (!currentUserId) {
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
				} = await mutationCreateOrganizationArgumentsSchema.safeParseAsync(
					args,
				);

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

				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				if (!currentUser) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				if (currentUser.role !== "administrator") {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				const existingOrganizationWithName =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.name, parsedArgs.input.name),
					});

				if (existingOrganizationWithName) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "name"],
									message: "This name is not available.",
								},
							],
						},
					});
				}

				const avatarMeta = isNotNullish(parsedArgs.input.avatar)
					? {
							avatarName: parsedArgs.input.avatar.objectName,
							avatarMimeType: parsedArgs.input.avatar.mimeType,
						}
					: {};

				const createdOrganization = await ctx.drizzleClient.transaction(
					async (tx) => {
						const [result] = await tx
							.insert(organizationsTable)
							.values({
								addressLine1: parsedArgs.input.addressLine1,
								addressLine2: parsedArgs.input.addressLine2,
								city: parsedArgs.input.city,
								countryCode: parsedArgs.input.countryCode,
								description: parsedArgs.input.description,
								creatorId: currentUserId,
								name: parsedArgs.input.name,
								postalCode: parsedArgs.input.postalCode,
								state: parsedArgs.input.state,
								userRegistrationRequired:
									parsedArgs.input.isUserRegistrationRequired,
								...avatarMeta,
							})
							.returning();

						// Inserted organization not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
						if (!result) {
							ctx.log.error(
								"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
							);

							throw new TalawaGraphQLError({
								extensions: {
									code: "unexpected",
								},
							});
						}

						if (isNotNullish(parsedArgs.input.avatar) && result.avatarName) {
							// Verify the file exists in MinIO (uploaded via presigned URL)
							try {
								await ctx.minio.client.statObject(
									ctx.minio.bucketName,
									result.avatarName,
								);
							} catch (error) {
								// Only treat NotFound as user error
								if (
									error instanceof Error &&
									(error.name === "NotFound" ||
										error.message.includes("Not Found") ||
										(error as { code?: string }).code === "NotFound")
								) {
									throw new TalawaGraphQLError({
										extensions: {
											code: "invalid_arguments",
											issues: [
												{
													argumentPath: ["input", "avatar", "objectName"],
													message:
														"File not found in storage. Please upload the file first.",
												},
											],
										},
									});
								}
								// For other errors, throw unexpected
								throw new TalawaGraphQLError({
									extensions: {
										code: "unexpected",
									},
								});
							}
						}

						return result;
					},
				);

				await runBestEffortInvalidation(
					[invalidateEntityLists(ctx.cache, "organization")],
					"organization",
					ctx.log,
				);

				return createdOrganization;
			},
		),
		type: Organization,
	}),
);
