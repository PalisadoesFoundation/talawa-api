import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateOrganizationInput,
	mutationUpdateOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationUpdateOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateOrganizationArgumentsSchema = z.object({
	input: mutationUpdateOrganizationInputSchema.transform(async (arg, ctx) => {
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
					message: `Mime type ${rawAvatar.mimetype} not allowed for this file upload.`,
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

builder.mutationField("updateOrganization", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateOrganizationInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a organization.",
		resolve: async (_parent, args, ctx) => {
			const executeMutation = async () => {
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
				} = await mutationUpdateOrganizationArgumentsSchema.safeParseAsync(
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

				const currentUserId = ctx.currentClient.user.id;

				// Track validation operations separately
				const validationStop = ctx.perf?.start("validation");
				let existingOrganization: { avatarName: string | null } | undefined;
				try {
					const [currentUser, org] = await Promise.all([
						ctx.drizzleClient.query.usersTable.findFirst({
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						}),
						ctx.drizzleClient.query.organizationsTable.findFirst({
							columns: {
								avatarName: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.id, parsedArgs.input.id),
						}),
					]);

					existingOrganization = org;

					if (currentUser === undefined) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					if (existingOrganization === undefined) {
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

					if (currentUser.role !== "administrator") {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					if (parsedArgs.input.name !== undefined) {
						const name = parsedArgs.input.name;

						const duplicateOrganizationName =
							await ctx.drizzleClient.query.organizationsTable.findFirst({
								columns: { id: true },
								where: (fields, operators) =>
									operators.and(
										operators.eq(fields.name, name),
										operators.ne(fields.id, parsedArgs.input.id),
									),
							});

						if (duplicateOrganizationName !== undefined) {
							throw new TalawaGraphQLError({
								message: "Organization name already exists",
								extensions: {
									code: "invalid_arguments",
									issues: [
										{
											argumentPath: ["input", "name"],
											message: "Organization name already exists",
										},
									],
								},
							});
						}
					}
				} finally {
					validationStop?.();
				}

				let avatarMimeType: z.infer<typeof imageMimeTypeEnum> | undefined;
				let avatarName: string | undefined;

				if (isNotNullish(parsedArgs.input.avatar)) {
					avatarName =
						existingOrganization.avatarName === null
							? ulid()
							: existingOrganization.avatarName;
					avatarMimeType = parsedArgs.input.avatar.mimetype;
				}

				return await ctx.drizzleClient.transaction(async (tx) => {
					// Track database update time separately from validation
					const dbUpdateStop = ctx.perf?.start("db:organization-update");
					let updatedOrganization:
						| typeof organizationsTable.$inferSelect
						| undefined;
					try {
						[updatedOrganization] = await tx
							.update(organizationsTable)
							.set({
								addressLine1: parsedArgs.input.addressLine1,
								addressLine2: parsedArgs.input.addressLine2,
								...(parsedArgs.input.avatar !== undefined && {
									avatarMimeType: isNotNullish(parsedArgs.input.avatar)
										? avatarMimeType
										: null,
									avatarName: isNotNullish(parsedArgs.input.avatar)
										? avatarName
										: null,
								}),
								city: parsedArgs.input.city,
								countryCode: parsedArgs.input.countryCode,
								description: parsedArgs.input.description,
								name: parsedArgs.input.name,
								postalCode: parsedArgs.input.postalCode,
								state: parsedArgs.input.state,
								updaterId: currentUserId,
								userRegistrationRequired:
									parsedArgs.input.isUserRegistrationRequired,
							})
							.where(eq(organizationsTable.id, parsedArgs.input.id))
							.returning();
					} finally {
						dbUpdateStop?.();
					}

					// Updated organization not being returned means that either it doesn't exist or it was deleted or its `id` column was changed by external entities before this update operation could take place.
					if (updatedOrganization === undefined) {
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

					if (
						isNotNullish(parsedArgs.input.avatar) &&
						avatarName !== undefined
					) {
						const fileUploadStop = ctx.perf?.start("file:avatar-upload");
						try {
							await ctx.minio.client.putObject(
								ctx.minio.bucketName,
								avatarName,
								parsedArgs.input.avatar.createReadStream(),
								undefined,
								{
									"content-type": parsedArgs.input.avatar.mimetype,
								},
							);
						} finally {
							fileUploadStop?.();
						}
					} else if (
						parsedArgs.input.avatar !== undefined &&
						existingOrganization.avatarName !== null
					) {
						const fileRemoveStop = ctx.perf?.start("file:avatar-remove");
						try {
							await ctx.minio.client.removeObject(
								ctx.minio.bucketName,
								existingOrganization.avatarName,
							);
						} finally {
							fileRemoveStop?.();
						}
					}

					return updatedOrganization;
				});
			};

			if (ctx.perf) {
				return await ctx.perf.time(
					"mutation:updateOrganization",
					executeMutation,
				);
			}

			return await executeMutation();
		},
		type: Organization,
	}),
);
