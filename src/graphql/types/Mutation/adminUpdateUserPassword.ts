import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import z from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import {
	MutationAdminUpdateUserPasswordInput,
	mutationAdminUpdateUserPasswordInputSchema,
} from "~/src/graphql/inputs/MutationAdminUpdateUserPasswordInput";
import envConfig from "~/src/utilities/graphqLimits";
import { revokeAllUserRefreshTokens } from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { builder } from "../../builder";

const mutationAdminUpdateUserPasswordArgumentsSchema = z.object({
	input: mutationAdminUpdateUserPasswordInputSchema,
});

builder.mutationField("adminUpdateUserPassword", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for updating a member's password by an admin.",
				required: true,
				type: MutationAdminUpdateUserPasswordInput,
			}),
		},
		description:
			"Mutation to allow an administrator to reset another user's password.",
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST,
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = await mutationAdminUpdateUserPasswordArgumentsSchema.safeParseAsync(
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

			const [currentUser, existingUser] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
						passwordHash: true,
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

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
					},
				});
			}

			if (parsedArgs.input.id === currentUserId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"You cannot update the user record associated to you with this action.",
							},
						],
					},
				});
			}

			if (existingUser === undefined) {
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

			if (!existingUser.passwordHash) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "id"],
								message: "User does not have password login enabled",
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

			const samePassword = await verify(
				existingUser.passwordHash,
				parsedArgs.input.newPassword,
			);

			if (samePassword) {
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

			const newPasswordHash = await hash(parsedArgs.input.newPassword);
			await ctx.drizzleClient.transaction(async (tx) => {
				await tx
					.update(usersTable)
					.set({
						passwordHash: newPasswordHash,
						failedLoginAttempts: 0,
						lockedUntil: null,
						lastFailedLoginAt: null,
					})
					.where(eq(usersTable.id, parsedArgs.input.id));

				await revokeAllUserRefreshTokens(tx, parsedArgs.input.id);
			});

			ctx.log.info(
				{
					actorUserId: currentUserId,
					targetUserId: parsedArgs.input.id,
					action: "admin_password_reset",
				},
				"Admin reset user password",
			);

			return true;
		},
		type: "Boolean",
	}),
);
