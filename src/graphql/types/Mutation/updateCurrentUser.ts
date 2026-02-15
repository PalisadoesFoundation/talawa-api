import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCurrentUserInput,
	mutationUpdateCurrentUserInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCurrentUserInput";
import { User } from "~/src/graphql/types/User/User";
import {
	invalidateEntity,
	invalidateEntityLists,
} from "~/src/services/caching/invalidation";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

export const mutationUpdateCurrentUserArgumentsSchema = z.object({
	input: mutationUpdateCurrentUserInputSchema.transform(async (arg, ctx) => {
		let avatar:
			| (FileUpload & {
					mimetype: z.infer<typeof imageMimeTypeEnum>;
			  })
			| null
			| undefined;

		if (isNotNullish(arg.avatar)) {
			const rawAvatar = await arg.avatar;
			const { data, success } = imageMimeTypeEnum.safeParse(rawAvatar.mimetype);

			if (!success) {
				ctx.addIssue({
					code: "custom",
					path: ["avatar"],
					message: `Mime type "${rawAvatar.mimetype}" is not allowed.`,
				});
			} else {
				avatar = Object.assign(rawAvatar, {
					mimetype: data,
				});
			}
		} else if (arg.avatar !== undefined) {
			avatar = null;
		}

		return {
			...arg,
			avatar,
		};
	}),
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

			const avatarUpdate = isNotNullish(parsedArgs.input.avatar)
				? {
						avatarName:
							currentUser.avatarName === null ? ulid() : currentUser.avatarName,
						avatarMimeType: parsedArgs.input.avatar.mimetype,
					}
				: null;

			const result = await ctx.drizzleClient.transaction(async (tx) => {
				const updateResult = await tx
					.update(usersTable)
					.set({
						addressLine1: parsedArgs.input.addressLine1,
						addressLine2: parsedArgs.input.addressLine2,
						avatarMimeType:
							parsedArgs.input.avatar === undefined
								? undefined // Do not update if undefined
								: avatarUpdate !== null
									? avatarUpdate.avatarMimeType
									: null, // Set to null if null
						avatarName:
							parsedArgs.input.avatar === undefined
								? undefined // Do not update if undefined
								: avatarUpdate !== null
									? avatarUpdate.avatarName
									: null, // Set to null if null
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

				if (isNotNullish(parsedArgs.input.avatar) && avatarUpdate) {
					await ctx.minio.client.putObject(
						ctx.minio.bucketName,
						avatarUpdate.avatarName,
						parsedArgs.input.avatar.createReadStream(),
						undefined,
						{
							"content-type": parsedArgs.input.avatar.mimetype,
						},
					);
				} else if (
					parsedArgs.input.avatar !== undefined &&
					currentUser.avatarName !== null
				) {
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						currentUser.avatarName,
					);
				}

				return updatedCurrentUser;
			});

			const results = await Promise.allSettled([
				invalidateEntity(ctx.cache, "user", currentUserId),
				invalidateEntityLists(ctx.cache, "user"),
			]);

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (result !== undefined && result.status === "rejected") {
					ctx.log.error(
						{ cacheError: result.reason, entity: "user", opIndex: i },
						"Cache invalidation failed",
					);
				}
			}

			return result;
		},
		type: User,
	}),
);
