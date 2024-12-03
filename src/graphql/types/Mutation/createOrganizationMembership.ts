import { z } from "zod";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateOrganizationMembershipInput,
	mutationCreateOrganizationMembershipInputSchema,
} from "~/src/graphql/inputs/MutationCreateOrganizationMembershipInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateOrganizationMembershipArgumentsSchema = z.object({
	input: mutationCreateOrganizationMembershipInputSchema,
});

builder.mutationField("createOrganizationMembership", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateOrganizationMembershipInput,
			}),
		},
		description: "Mutation field to create an organization membership.",
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
			} = mutationCreateOrganizationMembershipArgumentsSchema.safeParse(args);

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

			const [
				currentUser,
				existingMember,
				existingOrganization,
				existingOrganizationMembership,
			] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.memberId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				}),
				ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.memberId, parsedArgs.input.memberId),
							operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							),
						),
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

			if (existingOrganization === undefined && existingMember === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (existingMember === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
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

			if (existingOrganizationMembership !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "memberId"],
								message:
									"This user already has the membership of the associated organization.",
							},
							{
								argumentPath: ["input", "organizationId"],
								message: "This organization already has the associated member.",
							},
						],
					},
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
				});
			}

			if (currentUser.role !== "administrator") {
				const unauthorizedArgumentPaths = getKeyPathsWithNonUndefinedValues({
					keyPaths: [["input", "role"]],
					object: parsedArgs,
				});

				if (unauthorizedArgumentPaths.length !== 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_arguments",
							issues: unauthorizedArgumentPaths.map((argumentPath) => ({
								argumentPath,
							})),
						},
						message:
							"You are not authorized to perform this action with the provided arguments.",
					});
				}
			}

			const [createdOrganizationMembership] = await ctx.drizzleClient
				.insert(organizationMembershipsTable)
				.values({
					creatorId: currentUserId,
					memberId: parsedArgs.input.memberId,
					organizationId: parsedArgs.input.organizationId,
					role:
						parsedArgs.input.role === undefined
							? "regular"
							: parsedArgs.input.role,
				})
				.returning();

			// Inserted organization membership not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdOrganizationMembership === undefined) {
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

			return existingOrganization;
		},
		type: Organization,
	}),
);
