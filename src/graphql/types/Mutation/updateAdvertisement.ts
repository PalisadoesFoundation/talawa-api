import { eq } from "drizzle-orm";
import { z } from "zod";
import { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateAdvertisementInput,
	mutationUpdateAdvertisementInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAdvertisementInput";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateAdvertisementArgumentsSchema = z.object({
	input: mutationUpdateAdvertisementInputSchema,
});

builder.mutationField("updateAdvertisement", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateAdvertisementInput,
			}),
		},
		description: "Mutation field to update an advertisement.",
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
			} = mutationUpdateAdvertisementArgumentsSchema.safeParse(args);

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

			const [currentUser, existingAdvertisement] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.advertisementsTable.findFirst({
					columns: {
						endAt: true,
						organizationId: true,
						startAt: true,
					},
					with: {
						advertisementAttachmentsWhereAdvertisement: true,
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								organizationMembershipsWhereOrganization: {
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (
				parsedArgs.input.endAt === undefined &&
				parsedArgs.input.startAt !== undefined &&
				existingAdvertisement.endAt <= parsedArgs.input.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "startAt"],
								message: `Must be smaller than the value: ${parsedArgs.input.startAt.toISOString()}`,
							},
						],
					},
					message: "Invalid arguments provided.",
				});
			}

			if (
				parsedArgs.input.endAt !== undefined &&
				parsedArgs.input.startAt === undefined &&
				parsedArgs.input.endAt <= existingAdvertisement.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "endAt"],
								message: `Must be greater than the value: ${parsedArgs.input.endAt.toISOString()}`,
							},
						],
					},
					message: "Invalid arguments provided.",
				});
			}

			if (parsedArgs.input.name !== undefined) {
				const name = parsedArgs.input.name;

				const existingAdvertisementWithName =
					await ctx.drizzleClient.query.advertisementsTable.findFirst({
						columns: {
							type: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.name, name),
								operators.eq(
									fields.organizationId,
									existingAdvertisement.organizationId,
								),
							),
					});

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
			}

			const currentUserOrganizationMembership =
				existingAdvertisement.organization
					.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [updatedAdvertisement] = await ctx.drizzleClient
				.update(advertisementsTable)
				.set({
					description: parsedArgs.input.description,
					endAt: parsedArgs.input.endAt,
					startAt: parsedArgs.input.startAt,
					name: parsedArgs.input.name,
					type: parsedArgs.input.type,
					updaterId: currentUserId,
				})
				.where(eq(advertisementsTable.id, parsedArgs.input.id))
				.returning();

			// Updated advertisement not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedAdvertisement === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return Object.assign(updatedAdvertisement, {
				attachments:
					existingAdvertisement.advertisementAttachmentsWhereAdvertisement,
			});
		},
		type: Advertisement,
	}),
);
