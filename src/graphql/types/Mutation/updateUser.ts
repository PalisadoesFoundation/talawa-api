import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateUserInput,
	mutationUpdateUserInputSchema,
} from "~/src/graphql/inputs/MutationUpdateUserInput";
import { User } from "~/src/graphql/types/User/User";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateUserArgumentsSchema = z.object({
	input: mutationUpdateUserInputSchema.transform(async (arg, ctx) => {
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

builder.mutationField("updateUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input required to update a user.",
				required: true,
				type: MutationUpdateUserInput,
			}),
		},
		description: "Mutation field to update a user.",
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
					message: "Invalid arguments provided.",
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
					columns: { avatarName: true, role: true },
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
					message: "You are not authorized to perform this action.",
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
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			let avatarMimeType: z.infer<typeof imageMimeTypeEnum>;
			let avatarName: string;

			if (isNotNullish(parsedArgs.input.avatar)) {
				avatarName =
					existingUser.avatarName === null ? ulid() : existingUser.avatarName;
				avatarMimeType = parsedArgs.input.avatar.mimetype;
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [updatedUser] = await ctx.drizzleClient
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
						isEmailAddressVerified: parsedArgs.input.isEmailAddressVerified,
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
						message:
							"No associated resources found for the provided arguments.",
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
					existingUser.avatarName !== null
				) {
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						existingUser.avatarName,
					);
				}

				return updatedUser;
			});
		},
		type: User,
	}),
);
