import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { HasUserVoted } from "~/src/graphql/types/Post/hasUserVoted";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryHasUserVotedInput,
	queryHasUserVotedInputSchema,
} from "../../inputs/QueryHasUserVotedInput";

const queryHasUserVotedArgumentsSchema = z.object({
	input: queryHasUserVotedInputSchema,
});

builder.queryField("hasUserVoted", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryHasUserVotedInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to read a post vote.",
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
			} = queryHasUserVotedArgumentsSchema.safeParse(args);

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
			const [currentUser, postWithOrganization, existingPostVote] =
				await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.postsTable.findFirst({
						with: {
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
							operators.eq(fields.id, parsedArgs.input.postId),
					}),
					await ctx.drizzleClient.query.postVotesTable.findFirst({
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.postId, parsedArgs.input.postId),
								operators.eq(fields.creatorId, currentUserId),
							),
					}),
				]);
			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}
			if (postWithOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "postId"],
							},
						],
					},
				});
			}
			const currentUserOrganizationMembership =
				postWithOrganization.organization.membershipsWhereOrganization[0];
			if (currentUserOrganizationMembership === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "postId"],
							},
						],
					},
				});
			}

			if (existingPostVote === undefined) {
				return {
					voteType: null,
					hasVoted: false,
				};
			}
			return {
				voteType: existingPostVote.type,
				hasVoted: true,
			};
		},
		type: HasUserVoted,
	}),
);
