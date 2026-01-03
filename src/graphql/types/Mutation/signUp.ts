import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationSignUpInput,
	mutationSignUpInputSchema,
} from "~/src/graphql/inputs/MutationSignUpInput";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { validateRecaptchaIfRequired } from "~/src/utilities/recaptchaUtils";
import {
	DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
	generateRefreshToken,
	hashRefreshToken,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { CurrentClient } from "../../context";

const mutationSignUpArgumentsSchema = z.object({
	input: mutationSignUpInputSchema.transform(async (arg, ctx) => {
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

builder.mutationField("signUp", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationSignUpInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to sign up to talawa.",
		resolve: async (_parent, args, ctx) => {
			if (ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = await mutationSignUpArgumentsSchema.safeParseAsync(args);

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

			// Verify reCAPTCHA if required
			await validateRecaptchaIfRequired(
				parsedArgs.input.recaptchaToken,
				ctx.envConfig.RECAPTCHA_SECRET_KEY,
				["input", "recaptchaToken"],
				ctx.log,
			);

			const [[existingUserWithEmailAddress], existingOrganization] =
				await Promise.all([
					ctx.drizzleClient
						.select()
						.from(usersTable)
						.where(eq(usersTable.emailAddress, parsedArgs.input.emailAddress)),
					ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.selectedOrganization),
					}),
				]);

			if (existingUserWithEmailAddress !== undefined) {
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

			if (existingOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "selectedOrganization"],
								message: "This organization does not exist.",
							},
						],
					},
				});
			}

			const userId = uuidv7();
			let avatarMimeType: z.infer<typeof imageMimeTypeEnum>;
			let avatarName: string;

			if (isNotNullish(parsedArgs.input.avatar)) {
				avatarName = ulid();
				avatarMimeType = parsedArgs.input.avatar.mimetype;
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
						creatorId: userId,
						description: parsedArgs.input.description,
						educationGrade: parsedArgs.input.educationGrade,
						emailAddress: parsedArgs.input.emailAddress,
						employmentStatus: parsedArgs.input.employmentStatus,
						homePhoneNumber: parsedArgs.input.homePhoneNumber,
						id: userId,
						isEmailAddressVerified: false,
						maritalStatus: parsedArgs.input.maritalStatus,
						mobilePhoneNumber: parsedArgs.input.mobilePhoneNumber,
						name: parsedArgs.input.name,
						natalSex: parsedArgs.input.natalSex,
						naturalLanguageCode: parsedArgs.input.naturalLanguageCode,
						passwordHash: await hash(parsedArgs.input.password),
						postalCode: parsedArgs.input.postalCode,
						role: "regular",
						state: parsedArgs.input.state,
						workPhoneNumber: parsedArgs.input.workPhoneNumber,
					})
					.returning();

				// Inserted user not being returned is a external defect unrelated to this code. It is very unlikely for this error to occur.
				if (createdUser === undefined) {
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

				// If the organization does not require user registration, create a membership for the user in the organization.
				if (existingOrganization.userRegistrationRequired === false) {
					const [createdOrganizationMembership] = await tx
						.insert(organizationMembershipsTable)
						.values({
							creatorId: createdUser.id,
							memberId: createdUser.id,
							organizationId: parsedArgs.input.selectedOrganization,
							role: "regular",
						})
						.returning();

					// Inserted organization membership not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
					if (createdOrganizationMembership === undefined) {
						ctx.log.error(
							"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
						);

						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
					// Else user registration is required then create membership requeest
				} else {
					const newRequest = await tx
						.insert(membershipRequestsTable)
						.values({
							userId: createdUser.id,
							organizationId: parsedArgs.input.selectedOrganization,
						})
						.returning();

					if (newRequest.length === 0) {
						throw new TalawaGraphQLError({
							extensions: { code: "unexpected" },
						});
					}
				}

				// TODO: The following code is necessary for continuing the expected graph traversal for unauthenticated clients that triggered this operation because of absence of an authentication context for those clients. This should be removed when authentication flows are seperated from the graphql implementation.
				ctx.currentClient.isAuthenticated = true;
				ctx.currentClient.user = {
					id: createdUser.id,
				} as CurrentClient["user"];

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

				const accessToken = ctx.jwt.sign({
					user: {
						id: createdUser.id,
					},
				});

				// Set HTTP-Only cookies for web clients if cookie helper is available
				// This protects tokens from XSS attacks by making them inaccessible to JavaScript
				if (ctx.cookie) {
					ctx.cookie.setAuthCookies(accessToken, rawRefreshToken);
				}

				return {
					// Return tokens in response body for mobile clients (backward compatibility)
					// Web clients using cookies can ignore these values
					authenticationToken: accessToken,
					refreshToken: rawRefreshToken,
					user: createdUser,
				};
			});
		},
		type: AuthenticationPayload,
	}),
);
