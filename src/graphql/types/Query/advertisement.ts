import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryAdvertisementInput,
	queryAdvertisementInputSchema,
} from "~/src/graphql/inputs/QueryAdvertisementInput";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryAdvertisementArgumentsSchema = z.object({
	input: queryAdvertisementInputSchema,
});

builder.queryField("advertisement", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryAdvertisementInput,
			}),
		},
		description: "Query field to read an advertisement.",
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
			} = queryAdvertisementArgumentsSchema.safeParse(args);

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
				currentUserOrganizationMembership === undefined
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

			return Object.assign(existingAdvertisement, {
				attachments: existingAdvertisement.attachmentsWhereAdvertisement,
			});
		},
		type: Advertisement,
	}),
);
//To Fetch All Advertisment for a particular organistation by user.
const queryAdvertisementsByOrgInputSchema = z.object({
	input: z.object({
		organizationId: z.string(),
	}),
});

builder.queryField("advertisementsByOrg", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for fetching advertisements by organization ID",
				required: true,
				type: builder.inputType("QueryAdvertisementsByOrgInput", {
					fields: (t) => ({
						organizationId: t.string({ required: true }),
					}),
				}),
			}),
		},
		description:
			"Query field to read multiple advertisements for an organization.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = queryAdvertisementsByOrgInputSchema.safeParse(args);

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

			const [currentUser, organization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: { id: true },
					with: {
						membershipsWhereOrganization: {
							columns: { role: true },
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				}),
			]);

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			if (!organization) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			const currentUserOrganizationMembership =
				organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				!currentUserOrganizationMembership
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			const advertisements =
				await ctx.drizzleClient.query.advertisementsTable.findMany({
					with: {
						attachmentsWhereAdvertisement: true,
					},
					where: (fields, operators) =>
						operators.eq(
							fields.organizationId,
							parsedArgs.input.organizationId,
						),
				});

			return advertisements.map((advertisement) =>
				Object.assign(advertisement, {
					attachments: advertisement.attachmentsWhereAdvertisement,
				}),
			);
		},
		type: [Advertisement],
	}),
);
