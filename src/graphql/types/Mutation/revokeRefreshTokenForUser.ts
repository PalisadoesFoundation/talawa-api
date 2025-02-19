import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	RevokeRefreshTokenInput,
	revokeRefreshTokenInputSchema,
} from "../../inputs/MutationRevokeRefreshTokenForUserInput";
const revokeRefreshTokenArgumentsSchema = z.object({
	input: revokeRefreshTokenInputSchema,
});

builder.mutationField("revokeRefreshTokenForUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input containing user ID whose refresh token should be revoked.",
				required: true,
				type: RevokeRefreshTokenInput,
			}),
		},
		description:
			"Revokes the refresh token for a user by unsetting their stored token.",
		type: "Boolean",
		resolve: async (_parent, args, ctx) => {
			try {
				const {
					data: parsedArgs,
					error,
					success,
				} = revokeRefreshTokenArgumentsSchema.safeParse(args);

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

				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.id),
					},
				);

				if (!existingUser) {
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
				return true;
			} catch (error) {
				console.error("Error revoking refresh token:", error);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message: "An unexpected error occurred while revoking the token.",
					},
				});
			}
		},
	}),
);
