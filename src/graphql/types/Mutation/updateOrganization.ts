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
import { executeMutation } from "~/src/graphql/utils/withMutationMetrics";
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
			return executeMutation("updateOrganization", ctx, async () => {
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

				const [currentUser, existingOrganization] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.organizationsTable.findFirst({
						columns: {
							addressLine1: true,
							addressLine2: true,
							avatarMimeType: true,
							avatarName: true,
							city: true,
							countryCode: true,
							description: true,
							name: true,
							postalCode: true,
							state: true,
							updaterId: true,
							userRegistrationRequired: true,
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

				let avatarMimeType: z.infer<typeof imageMimeTypeEnum> | undefined;
				let avatarName: string | undefined;

				if (isNotNullish(parsedArgs.input.avatar)) {
					avatarName =
						existingOrganization.avatarName === null
							? ulid()
							: existingOrganization.avatarName;
					avatarMimeType = parsedArgs.input.avatar.mimetype;
				}

				let updatedOrganization: typeof organizationsTable.$inferSelect;

				try {
					updatedOrganization = await ctx.drizzleClient.transaction(
						async (tx) => {
							const [updatedOrganization] = await tx
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

							return updatedOrganization;
						},
					);
				} catch (error) {
					if (
						typeof error === "object" &&
						error !== null &&
						"code" in error &&
						(error as { code: unknown }).code === "23505"
					) {
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
					throw error;
				}

				if (isNotNullish(parsedArgs.input.avatar) && avatarName !== undefined) {
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
					} catch (error) {
						ctx.log.error(
							error,
							"Avatar upload failed for updateOrganization. Reverting DB changes.",
						);

						await ctx.drizzleClient
							.update(organizationsTable)
							.set({
								addressLine1: existingOrganization.addressLine1,
								addressLine2: existingOrganization.addressLine2,
								avatarMimeType: existingOrganization.avatarMimeType,
								avatarName: existingOrganization.avatarName,
								city: existingOrganization.city,
								countryCode: existingOrganization.countryCode,
								description: existingOrganization.description,
								name: existingOrganization.name,
								postalCode: existingOrganization.postalCode,
								state: existingOrganization.state,
								updaterId: existingOrganization.updaterId,
								userRegistrationRequired:
									existingOrganization.userRegistrationRequired,
							})
							.where(eq(organizationsTable.id, updatedOrganization.id));

						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
				} else if (
					parsedArgs.input.avatar !== undefined &&
					existingOrganization.avatarName !== null
				) {
					try {
						await ctx.minio.client.removeObject(
							ctx.minio.bucketName,
							existingOrganization.avatarName,
						);
					} catch (error) {
						ctx.log.error(
							error,
							"Avatar removal failed for updateOrganization. Reverting DB changes.",
						);

						await ctx.drizzleClient
							.update(organizationsTable)
							.set({
								addressLine1: existingOrganization.addressLine1,
								addressLine2: existingOrganization.addressLine2,
								avatarMimeType: existingOrganization.avatarMimeType,
								avatarName: existingOrganization.avatarName,
								city: existingOrganization.city,
								countryCode: existingOrganization.countryCode,
								description: existingOrganization.description,
								name: existingOrganization.name,
								postalCode: existingOrganization.postalCode,
								state: existingOrganization.state,
								updaterId: existingOrganization.updaterId,
								userRegistrationRequired:
									existingOrganization.userRegistrationRequired,
							})
							.where(eq(organizationsTable.id, updatedOrganization.id));

						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
				}

				return updatedOrganization;
			});
		},
		type: Organization,
	}),
);
