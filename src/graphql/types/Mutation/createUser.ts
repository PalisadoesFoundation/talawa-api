import { hash } from "@node-rs/argon2";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateUserInput,
	mutationCreateUserInputSchema,
} from "~/src/graphql/inputs/MutationCreateUserInput";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import { executeMutation } from "~/src/graphql/utils/withMutationMetrics";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import {
	DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
	generateRefreshToken,
	hashRefreshToken,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateUserArgumentsSchema = z.object({
	input: mutationCreateUserInputSchema.transform(async (arg, ctx) => {
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

builder.mutationField("createUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateUserInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a user.",
		resolve: async (_parent, args, ctx) => {
			return executeMutation("createUser", ctx, async () => {
				if (!ctx.currentClient.isAuthenticated) {
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
				} = await mutationCreateUserArgumentsSchema.safeParseAsync(args);

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

				const [currentUser, existingUserWithEmailAddress] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.emailAddress, parsedArgs.input.emailAddress),
					}),
				]);

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

				if (existingUserWithEmailAddress) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "emailAddress"],
									message: "This email address is already registered.",
								},
							],
						},
					});
				}

				let avatarMimeType: z.infer<typeof imageMimeTypeEnum>;
				let avatarName: string;

				if (isNotNullish(parsedArgs.input.avatar)) {
					avatarMimeType = parsedArgs.input.avatar.mimetype;
					avatarName = ulid();
				}

				return await ctx.drizzleClient.transaction(async (tx) => {
					const [createdUser] = await tx
						.insert(usersTable)
						.values({
							addressLine1: parsedArgs.input.addressLine1,
							addressLine2: parsedArgs.input.addressLine2,
							avatarMimeType,
							avatarName,
							birthDate: parsedArgs.input.birthDate,
							city: parsedArgs.input.city,
							countryCode: parsedArgs.input.countryCode,
							creatorId: currentUserId,
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
							passwordHash: await hash(parsedArgs.input.password),
							postalCode: parsedArgs.input.postalCode,
							role: parsedArgs.input.role,
							state: parsedArgs.input.state,
							workPhoneNumber: parsedArgs.input.workPhoneNumber,
						})
						.returning();

					// Inserted user not being returned is a external defect unrelated to this code. It is very unlikely for this error to occur.
					if (!createdUser) {
						ctx.log.error(
							"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
						);

						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					if (isNotNullish(parsedArgs.input.avatar)) {
						await ctx.minio.client.putObject(
							ctx.minio.bucketName,
							avatarName,
							parsedArgs.input.avatar.createReadStream(),
							undefined,
							{
								"content-type": parsedArgs.input.avatar.mimetype,
							},
						);
					}

					// Generate refresh token
					const rawRefreshToken = generateRefreshToken();
					const refreshTokenHash = hashRefreshToken(rawRefreshToken);

					// Calculate refresh token expiry (default 7 days if not configured)
					const refreshTokenExpiresIn =
						ctx.envConfig.API_REFRESH_TOKEN_EXPIRES_IN ??
						DEFAULT_REFRESH_TOKEN_EXPIRES_MS;
					const refreshTokenExpiresAt = new Date(
						Date.now() + refreshTokenExpiresIn,
					);

					// Store refresh token in database (use tx to stay in the transaction)
					await storeRefreshToken(
						tx,
						createdUser.id,
						refreshTokenHash,
						refreshTokenExpiresAt,
					);

					return {
						authenticationToken: ctx.jwt.sign({
							user: {
								id: createdUser.id,
							},
						}),
						refreshToken: rawRefreshToken,
						user: createdUser,
					};
				});
			});
		},
		type: AuthenticationPayload,
	}),
);
