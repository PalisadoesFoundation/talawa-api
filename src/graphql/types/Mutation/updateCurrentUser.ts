import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCurrentUserInput,
	mutationUpdateCurrentUserInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCurrentUserInput";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateCurrentUserArgumentsSchema = z.object({
	input: mutationUpdateCurrentUserInputSchema,
});

builder.mutationField("updateCurrentUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input required to update the current user.",
				required: true,
				type: MutationUpdateCurrentUserInput,
			}),
		},
		description: "Mutation field to update the current user.",
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
				success,
				data: parsedArgs,
				error,
			} = mutationUpdateCurrentUserArgumentsSchema.safeParse(args);

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

			const { emailAddress, password, ...input } = parsedArgs.input;

			if (emailAddress !== undefined) {
				const existingUserWithEmailAddress =
					await ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.emailAddress, emailAddress),
					});

				if (existingUserWithEmailAddress !== undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "emailAddress"],
									message: "This email address is already registered.",
								},
							],
						},
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}
			}

			const passwordHash =
				password !== undefined ? await hash(password) : undefined;

			const [updatedCurrentUser] = await ctx.drizzleClient
				.update(usersTable)
				.set({
					...input,
					emailAddress,
					passwordHash,
					updaterId: ctx.currentClient.user.id,
				})
				.where(eq(usersTable.id, ctx.currentClient.user.id))
				.returning();

			// Updated user not being returned means that either it was deleted or its `id` column was changed by an external entity before this update operation which correspondingly means that the current client is using an invalid authentication token which hasn't expired yet.
			if (updatedCurrentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			return updatedCurrentUser;
		},
		type: User,
	}),
);
