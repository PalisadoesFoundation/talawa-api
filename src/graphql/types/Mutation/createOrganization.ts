import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateOrganizationInput,
	mutationCreateOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationCreateOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateOrganizationArgumentsSchema = z.object({
	input: mutationCreateOrganizationInputSchema.transform(async (arg, ctx) => {
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

builder.mutationField("createOrganization", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateOrganizationInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an organization.",
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
					data: parsedArgs,
					error,
					success,
				} = await mutationCreateOrganizationArgumentsSchema.safeParseAsync(
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

				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

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

				const existingOrganizationWithName =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.name, parsedArgs.input.name),
					});

				if (existingOrganizationWithName) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "name"],
									message: "This name is not available.",
								},
							],
						},
					});
				}

				let avatarMimeType: z.infer<typeof imageMimeTypeEnum> | null = null;
				let avatarName: string | null = null;

				if (isNotNullish(parsedArgs.input.avatar)) {
					avatarName = ulid();
					avatarMimeType = parsedArgs.input.avatar.mimetype;
				}

				return await ctx.drizzleClient.transaction(async (tx) => {
					// Track database insert operation
					const dbInsertStop = ctx.perf?.start("db:organization-insert");
					let createdOrganization:
						| typeof organizationsTable.$inferSelect
						| undefined;
					try {
						[createdOrganization] = await tx
							.insert(organizationsTable)
							.values({
								addressLine1: parsedArgs.input.addressLine1,
								addressLine2: parsedArgs.input.addressLine2,
								avatarMimeType,
								avatarName,
								city: parsedArgs.input.city,
								countryCode: parsedArgs.input.countryCode,
								description: parsedArgs.input.description,
								creatorId: currentUserId,
								name: parsedArgs.input.name,
								postalCode: parsedArgs.input.postalCode,
								state: parsedArgs.input.state,
								userRegistrationRequired:
									parsedArgs.input.isUserRegistrationRequired,
							})
							.returning();
					} finally {
						dbInsertStop?.();
					}

					// Inserted organization not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
					if (!createdOrganization) {
						ctx.log.error(
							"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
						);

						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					if (isNotNullish(parsedArgs.input.avatar) && avatarName !== null) {
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
					}

					return createdOrganization;
				});
			};

			if (ctx.perf) {
				return await ctx.perf.time(
					"mutation:createOrganization",
					executeMutation,
				);
			}

			return await executeMutation();
		},
		type: Organization,
	}),
);
