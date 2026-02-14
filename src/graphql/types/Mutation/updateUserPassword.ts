import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import z from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateUserPasswordInput,
	mutationUpdateUserPasswordInputSchema,
} from "~/src/graphql/inputs/MutationUpdateUserPasswordInput";
import envConfig from "~/src/utilities/graphqLimits";
import { checkPasswordChangeRateLimit } from "~/src/utilities/passwordChangeRateLimit";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * Zod schema for validating the updateUserPassword mutation arguments.
 */
const mutationUpdateUserPasswordArgumentsSchema = z.object({
	input: mutationUpdateUserPasswordInputSchema,
});

builder.mutationField("updateUserPassword", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for updating the current user's password.",
				required: true,
				type: MutationUpdateUserPasswordInput,
			}),
		},
		description: "Mutation field to update a user password.",
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (!checkPasswordChangeRateLimit(ctx.currentClient.user.id)) {
				throw new TalawaGraphQLError({
					message:
						"Too many password change attempts. Please try again later.",
					extensions: {
						code: "too_many_requests",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = await mutationUpdateUserPasswordArgumentsSchema.safeParseAsync(args);

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
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			if (!currentUser.passwordHash) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "oldPassword"],
								message:
									"Password authentication is not configured for this account",
							},
						],
					},
				});
			}

			const isValid = await verify(
				currentUser.passwordHash,
				parsedArgs.input.oldPassword,
			);

			if (!isValid) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "oldPassword"],
								message: "Current password is incorrect",
							},
						],
					},
				});
			}

			if (parsedArgs.input.newPassword === parsedArgs.input.oldPassword) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "newPassword"],
								message: "New password must be different from current password",
							},
						],
					},
				});
			}

			if (
				parsedArgs.input.newPassword !== parsedArgs.input.confirmNewPassword
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "confirmNewPassword"],
								message: "Passwords do not match",
							},
						],
					},
				});
			}

			const newPasswordHash = await hash(parsedArgs.input.newPassword);
			await ctx.drizzleClient
				.update(usersTable)
				.set({
					passwordHash: newPasswordHash,
					failedLoginAttempts: 0,
					lockedUntil: null,
					lastFailedLoginAt: null,
				})
				.where(eq(usersTable.id, currentUserId));

			return true;
		},
		type: "Boolean",
	}),
);
