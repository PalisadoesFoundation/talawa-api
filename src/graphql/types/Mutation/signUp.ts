import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationSignUpInput,
	mutationSignUpInputSchema,
} from "~/src/graphql/inputs/MutationSignUpInput";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { isNotNullish } from "~/src/utilities/isNotNullish";
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

			const [existingUserWithEmailAddress] = await ctx.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.emailAddress, parsedArgs.input.emailAddress));

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

				// TODO: The following code is necessary for continuing the expected graph traversal for unauthenticated clients that triggered this operation because of absence of an authentication context for those clients. This should be removed when authentication flows are seperated from the graphql implementation.
				ctx.currentClient.isAuthenticated = true;
				ctx.currentClient.user = {
					id: createdUser.id,
				} as CurrentClient["user"];

				return {
					authenticationToken: ctx.jwt.sign({
						user: {
							id: createdUser.id,
						},
					}),
					user: createdUser,
				};
			});
		},
		type: AuthenticationPayload,
	}),
);
