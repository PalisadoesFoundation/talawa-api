import { eq } from "drizzle-orm";
import { z } from "zod";
import { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteAdvertisementInput,
	mutationDeleteAdvertisementInputSchema,
} from "~/src/graphql/inputs/MutationDeleteAdvertisementInput";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteAdvertisementArgumentsSchema = z.object({
	input: mutationDeleteAdvertisementInputSchema,
});

builder.mutationField("deleteAdvertisement", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteAdvertisementInput,
			}),
		},
		description: "Mutation field to delete an advertisement.",
		resolve: async (_parent, args, ctx) => {
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
			} = mutationDeleteAdvertisementArgumentsSchema.safeParse(args);

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

			const [currentUser, existingAdvertisement] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.advertisementsTable.findFirst({
					columns: {
						type: true,
					},
					with: {
						attachmentsWhereAdvertisement: true,
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
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

			if (existingAdvertisement === undefined) {
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

			const currentUserOrganizationMembership =
				existingAdvertisement.organization.membershipsWhereOrganization[0];

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
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [deletedAdvertisement] = await tx
					.delete(advertisementsTable)
					.where(eq(advertisementsTable.id, parsedArgs.input.id))
					.returning();

				// Deleted advertisement not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation.
				if (deletedAdvertisement === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				await ctx.minio.client.removeObjects(
					ctx.minio.bucketName,
					existingAdvertisement.attachmentsWhereAdvertisement.map(
						(attachment) => attachment.name,
					),
				);

				return Object.assign(deletedAdvertisement, {
					attachments: existingAdvertisement.attachmentsWhereAdvertisement,
				});
			});
		},
		type: Advertisement,
	}),
);
