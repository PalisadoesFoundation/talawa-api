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
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateCurrentUserArgumentsSchema = z.object({
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
				return {
					...arg,
					avatar: Object.assign(rawAvatar, {
						mimetype: data,
					}),
				};
			}
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
				description: "Input required to update the current user.",
				required: true,
				type: MutationUpdateCurrentUserInput,
			}),
		},
		description: "Mutation field to update the current user.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
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
					message: "Invalid arguments provided.",
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
					message: "Only authenticated users can perform this action.",
				});
			}

			if (parsedArgs.input.emailAddress !== undefined) {
				const emailAddress = parsedArgs.input.emailAddress;

				const existingUserWithEmailAddress =
					await ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.emailAddress, emailAddress),
					});

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
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}
			}

			let avatarMimeType: z.infer<typeof imageMimeTypeEnum>;
			let avatarName: string;

			if (isNotNullish(parsedArgs.input.avatar)) {
				avatarName =
					currentUser.avatarName === null ? ulid() : currentUser.avatarName;
				avatarMimeType = parsedArgs.input.avatar.mimetype;
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [updatedCurrentUser] = await tx
					.update(usersTable)
					.set({
						address: parsedArgs.input.address,
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
						maritalStatus: parsedArgs.input.maritalStatus,
						mobilePhoneNumber: parsedArgs.input.mobilePhoneNumber,
						name: parsedArgs.input.name,
						natalSex: parsedArgs.input.natalSex,
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
				if (updatedCurrentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
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
		},
		type: User,
	}),
);
