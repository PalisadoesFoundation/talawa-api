import { z } from "zod";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateOrganizationMembershipInput,
	mutationCreateOrganizationMembershipInputSchema,
} from "~/src/graphql/inputs/MutationCreateOrganizationMembershipInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";

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
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingMember, existingOrganization] =
				await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
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
						with: {
							membershipsWhereOrganization: {
								columns: {
									role: true,
								},
								where: (fields, operators) =>
									operators.eq(fields.memberId, parsedArgs.input.memberId),
							},
						},
					}),
				]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
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
				});
			}

			const existingOrganizationMembership =
				existingOrganization.membershipsWhereOrganization[0];

			if (existingOrganizationMembership !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "memberId"],
								message:
									"This user already has the membership of the organization.",
							},
							{
								argumentPath: ["input", "organizationId"],
								message: "This organization already has the user as a member.",
							},
						],
					},
				});
			}

			if (currentUser.role !== "administrator") {
				// Only administrator users can create organization memberships for users other than themselves.
				if (currentUserId !== parsedArgs.input.memberId) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "memberId"],
								},
							],
						},
					});
				}

				const unauthorizedArgumentPaths = getKeyPathsWithNonUndefinedValues({
					keyPaths: [["input", "role"]],
					object: parsedArgs,
				});

				// Only administrator users can provide the argument `input.role` for  this graphql operation.
				if (unauthorizedArgumentPaths.length !== 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_arguments",
							issues: unauthorizedArgumentPaths.map((argumentPath) => ({
								argumentPath,
							})),
						},
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
				});
			}

			return existingOrganization;
		},
		type: Organization,
	}),
);
