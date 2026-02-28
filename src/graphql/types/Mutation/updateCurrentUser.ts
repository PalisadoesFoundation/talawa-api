import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCurrentUserInput,
	mutationUpdateCurrentUserInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCurrentUserInput";
import { User } from "~/src/graphql/types/User/User";
import { runBestEffortInvalidation } from "~/src/graphql/utils/runBestEffortInvalidation";
import {
	invalidateEntity,
	invalidateEntityLists,
} from "~/src/services/caching/invalidation";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

export const mutationUpdateCurrentUserArgumentsSchema = z.object({
	input: mutationUpdateCurrentUserInputSchema,
});

builder.mutationField("updateCurrentUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateCurrentUserInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update the current user.",
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
			} = await mutationUpdateCurrentUserArgumentsSchema.safeParseAsync(args);

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

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					avatarName: true,
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

			if (parsedArgs.input.emailAddress !== undefined) {
				const emailAddress = parsedArgs.input.emailAddress;

				const existingUserWithEmailAddress =
					await ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							id: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.emailAddress, emailAddress),
					});

				if (
					existingUserWithEmailAddress !== undefined &&
					existingUserWithEmailAddress.id !== currentUserId
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "emailAddress"],
									message: "This email address is not available.",
								},
							],
						},
					});
				}
			}

			let avatarUpdate: {
				avatarName: string | null;
				avatarMimeType: z.infer<typeof imageMimeTypeEnum> | null;
			} | null = null;

			if (parsedArgs.input.avatar !== undefined) {
				if (parsedArgs.input.avatar !== null) {
					const { data, success } = imageMimeTypeEnum.safeParse(
						parsedArgs.input.avatar.mimeType,
					);

					if (!success) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["input", "avatar", "mimeType"],
										message: `Mime type "${parsedArgs.input.avatar.mimeType}" is not allowed.`,
									},
								],
							},
						});
					}

					avatarUpdate = {
						avatarName: parsedArgs.input.avatar.objectName,
						avatarMimeType: data,
					};

					// Verify file exists in MinIO BEFORE database update
					try {
						await ctx.minio.client.statObject(
							ctx.minio.bucketName,
							avatarUpdate.avatarName as string,
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
						ctx.log.error(
							`Unexpected MinIO error: ${error instanceof Error ? error.message : String(error)}`,
						);
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
				} else {
					avatarUpdate = {
						avatarName: null,
						avatarMimeType: null,
					};
				}
			}

			const result = await ctx.drizzleClient.transaction(async (tx) => {
				const updateResult = await tx
					.update(usersTable)
					.set({
						addressLine1: parsedArgs.input.addressLine1,
						addressLine2: parsedArgs.input.addressLine2,
						avatarMimeType:
							parsedArgs.input.avatar === undefined
								? undefined // Do not update if undefined
								: avatarUpdate?.avatarMimeType, // Will be value or null
						avatarName:
							parsedArgs.input.avatar === undefined
								? undefined // Do not update if undefined
								: avatarUpdate?.avatarName, // Will be value or null
						birthDate: parsedArgs.input.birthDate,
						city: parsedArgs.input.city,
						countryCode: parsedArgs.input.countryCode,
						description: parsedArgs.input.description,
						educationGrade: parsedArgs.input.educationGrade,
						emailAddress: parsedArgs.input.emailAddress,
						employmentStatus: parsedArgs.input.employmentStatus,
						homePhoneNumber: parsedArgs.input.homePhoneNumber,
						maritalStatus: parsedArgs.input.maritalStatus,
						mobilePhoneNumber: parsedArgs.input.mobilePhoneNumber,
						name: parsedArgs.input.name,
						natalSex: parsedArgs.input.natalSex,
						naturalLanguageCode: parsedArgs.input.naturalLanguageCode,
						passwordHash:
							parsedArgs.input.password !== undefined
								? await hash(parsedArgs.input.password)
								: undefined,
						postalCode: parsedArgs.input.postalCode,
						state: parsedArgs.input.state,
						updaterId: currentUserId,
						workPhoneNumber: parsedArgs.input.workPhoneNumber,
					})
					.where(eq(usersTable.id, currentUserId))
					.returning();

				// Updated user not being returned means that either it was deleted or its `id` column was changed by an external entity before this update operation which correspondingly means that the current client is using an invalid authentication token which hasn't expired yet.
				if (updateResult.length === 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const updatedCurrentUser = updateResult[0];

				if (
					parsedArgs.input.avatar !== undefined &&
					currentUser.avatarName !== null &&
					parsedArgs.input.avatar?.objectName !== currentUser.avatarName
				) {
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						currentUser.avatarName,
					);
				}

				return updatedCurrentUser;
			});

			await runBestEffortInvalidation(
				[
					invalidateEntity(ctx.cache, "user", currentUserId),
					invalidateEntityLists(ctx.cache, "user"),
				],
				"user",
				ctx.log,
			);

			return result;
		},
		type: User,
	}),
);
