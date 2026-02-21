import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateUserInput,
	mutationUpdateUserInputSchema,
} from "~/src/graphql/inputs/MutationUpdateUserInput";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
const mutationUpdateUserArgumentsSchema = z.object({
	input: mutationUpdateUserInputSchema,
});

builder.mutationField("updateUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateUserInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a user.",
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
			} = await mutationUpdateUserArgumentsSchema.safeParseAsync(args);

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

			const [currentUser, existingUser] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						avatarName: true,
						role: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
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

			if (parsedArgs.input.id === currentUserId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"You cannot update the user record associated to you with this action.",
							},
						],
					},
				});
			}

			if (existingUser === undefined) {
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

			let avatarMimeType: z.infer<typeof imageMimeTypeEnum> | undefined;
			let avatarName: string | undefined;

			if (isNotNullish(parsedArgs.input.avatar)) {
				const { data, success } = imageMimeTypeEnum.safeParse(
					parsedArgs.input.avatar.mimetype,
				);

				if (!success) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "avatar", "mimetype"],
									message: `Mime type "${parsedArgs.input.avatar.mimetype}" is not allowed.`,
								},
							],
						},
					});
				}

				avatarName = parsedArgs.input.avatar.objectName;
				avatarMimeType = data;

				// Verify file exists in MinIO BEFORE database update
				try {
					await ctx.minio.client.statObject(ctx.minio.bucketName, avatarName);
				} catch (error) {
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
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Remove old avatar if it exists and has a different name
				if (
					existingUser.avatarName !== null &&
					existingUser.avatarName !== avatarName
				) {
					try {
						await ctx.minio.client.removeObject(
							ctx.minio.bucketName,
							existingUser.avatarName,
						);
					} catch (error) {
						ctx.log.warn(
							{ err: error, oldAvatarName: existingUser.avatarName },
							"Failed to remove old avatar during update",
						);
					}
				}
			} else if (
				parsedArgs.input.avatar !== undefined &&
				existingUser.avatarName !== null
			) {
				try {
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						existingUser.avatarName,
					);
				} catch (error) {
					ctx.log.warn(
						{ err: error, oldAvatarName: existingUser.avatarName },
						"Failed to remove old avatar during null assignment",
					);
				}
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [updatedUser] = await tx
					.update(usersTable)
					.set({
						addressLine1: parsedArgs.input.addressLine1,
						addressLine2: parsedArgs.input.addressLine2,
						avatarMimeType: isNotNullish(parsedArgs.input.avatar)
							? avatarMimeType
							: null,
						avatarName: isNotNullish(parsedArgs.input.avatar)
							? avatarName
							: null,
						birthDate: parsedArgs.input.birthDate,
						city: parsedArgs.input.city,
						countryCode: parsedArgs.input.countryCode,
						description: parsedArgs.input.description,
						educationGrade: parsedArgs.input.educationGrade,
						emailAddress: parsedArgs.input.emailAddress,
						employmentStatus: parsedArgs.input.employmentStatus,
						homePhoneNumber: parsedArgs.input.homePhoneNumber,
						isEmailAddressVerified: parsedArgs.input.isEmailAddressVerified,
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
						role: parsedArgs.input.role,
						updaterId: currentUserId,
						workPhoneNumber: parsedArgs.input.workPhoneNumber,
					})
					.where(eq(usersTable.id, parsedArgs.input.id))
					.returning();

				// Updated user not being returned means that either the user does not exist or it was deleted or its `id` column was changed by an external entity before this upate operation.
				if (updatedUser === undefined) {
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

				return updatedUser;
			});
		},
		type: User,
	}),
);
