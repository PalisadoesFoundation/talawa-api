import { z } from "zod";
import { advertisementAttachmentsTable } from "~/src/drizzle/tables/advertisementAttachments";
import { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateAdvertisementInput,
	mutationCreateAdvertisementInputSchema,
} from "~/src/graphql/inputs/MutationCreateAdvertisementInput";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateAdvertisementArgumentsSchema = z.object({
	input: mutationCreateAdvertisementInputSchema,
});

builder.mutationField("createAdvertisement", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateAdvertisementInput,
			}),
		},
		description: "Mutation field to create an advertisement.",
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
				data: parsedArgs,
				error,
				success,
			} = mutationCreateAdvertisementArgumentsSchema.safeParse(args);

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

			const [currentUser, existingOrganization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					with: {
						organizationMembershipsWhereMember: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(
									fields.organizationId,
									parsedArgs.input.organizationId,
								),
						},
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: {},
					with: {
						advertisementsWhereOrganization: {
							columns: {
								type: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.name, parsedArgs.input.name),
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
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

			if (existingOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			const existingAdvertisementWithName =
				existingOrganization.advertisementsWhereOrganization[0];

			if (existingAdvertisementWithName !== undefined) {
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
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				currentUser.organizationMembershipsWhereMember[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [createdAdvertisement] = await tx
					.insert(advertisementsTable)
					.values({
						creatorId: currentUserId,
						description: parsedArgs.input.description,
						endAt: parsedArgs.input.endAt,
						name: parsedArgs.input.name,
						organizationId: parsedArgs.input.organizationId,
						startAt: parsedArgs.input.startAt,
						type: parsedArgs.input.type,
					})
					.returning();

				// Inserted advertisement not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
				if (createdAdvertisement === undefined) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again.",
					});
				}

				if (parsedArgs.input.attachments !== undefined) {
					const createdAdvertisementAttachments = await tx
						.insert(advertisementAttachmentsTable)
						.values(
							parsedArgs.input.attachments.map((attachment) => ({
								advertisementId: createdAdvertisement.id,
								creatorId: currentUserId,
								type: attachment.type,
								uri: attachment.uri,
							})),
						)
						.returning();

					return Object.assign(createdAdvertisement, {
						attachments: createdAdvertisementAttachments,
					});
				}

				return Object.assign(createdAdvertisement, {
					attachments: [],
				});
			});
		},
		type: Advertisement,
	}),
);
