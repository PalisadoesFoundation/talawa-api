import { z } from "zod";
import { communitiesTable } from "~/src/drizzle/tables/communities";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCommunityInput,
	mutationUpdateCommunityInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCommunityInput";
import { Community } from "~/src/graphql/types/Community/Community";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateCommunityArgumentsSchema = z.object({
	input: mutationUpdateCommunityInputSchema,
});

builder.mutationField("updateCommunity", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateCommunityInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update the community.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = await mutationUpdateCommunityArgumentsSchema.safeParseAsync(args);

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

			const [currentUser, existingCommunity] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.communitiesTable.findFirst({
					columns: {
						logoName: true,
					},
				}),
			]);

			if (currentUser === undefined) {
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

			// Community not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
			if (existingCommunity === undefined) {
				ctx.log.error(
					"Postgres select operation returned an empty array for the community.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			let logoMimeType: string | undefined;
			let logoName: string | undefined;

			if (isNotNullish(parsedArgs.input.logo)) {
				// Use the objectName from the presigned URL upload
				logoName = parsedArgs.input.logo.objectName;
				logoMimeType = parsedArgs.input.logo.mimeType;
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [updatedCommunity] = await tx
					.update(communitiesTable)
					.set({
						facebookURL: parsedArgs.input.facebookURL,
						githubURL: parsedArgs.input.githubURL,
						inactivityTimeoutDuration:
							parsedArgs.input.inactivityTimeoutDuration,
						logoMimeType: isNotNullish(parsedArgs.input.logo)
							? logoMimeType
							: null,
						logoName: isNotNullish(parsedArgs.input.logo) ? logoName : null,
						instagramURL: parsedArgs.input.instagramURL,
						linkedinURL: parsedArgs.input.linkedinURL,
						name: parsedArgs.input.name,
						redditURL: parsedArgs.input.redditURL,
						slackURL: parsedArgs.input.slackURL,
						updaterId: currentUserId,
						websiteURL: parsedArgs.input.websiteURL,
						xURL: parsedArgs.input.xURL,
						youtubeURL: parsedArgs.input.youtubeURL,
					})
					.returning();

				// Updated community not being returned is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (updatedCommunity === undefined) {
					ctx.log.error(
						"Postgres update operation returned an empty array for the community.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				if (isNotNullish(parsedArgs.input.logo) && logoName) {
					// Verify the file exists in MinIO (uploaded via presigned URL)
					try {
						await ctx.minio.client.statObject(
							ctx.minio.bucketName,
							logoName,
						);
					} catch {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["input", "logo", "objectName"],
										message: "File not found in storage. Please upload the file first using the presigned URL.",
									},
								],
							},
						});
					}

					// Remove old logo if it exists and has a different name
					if (existingCommunity.logoName !== null && existingCommunity.logoName !== logoName) {
						try {
							await ctx.minio.client.removeObject(
								ctx.minio.bucketName,
								existingCommunity.logoName,
							);
						} catch {
							// Ignore errors when removing old file
						}
					}
				} else if (
					parsedArgs.input.logo !== undefined &&
					existingCommunity.logoName !== null
				) {
					// Logo was explicitly set to null, remove old logo
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						existingCommunity.logoName,
					);
				}

				return updatedCommunity;
			});
		},
		type: Community,
	}),
);
