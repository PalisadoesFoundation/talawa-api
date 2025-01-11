import { z } from "zod";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateChatMembershipInput,
	mutationCreateChatMembershipInputSchema,
} from "~/src/graphql/inputs/MutationCreateChatMembershipInput";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";

const mutationCreateChatMembershipArgumentsSchema = z.object({
	input: mutationCreateChatMembershipInputSchema,
});

builder.mutationField("createChatMembership", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateChatMembershipInput,
			}),
		},
		description: "Mutation field to create a chat membership.",
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
			} = mutationCreateChatMembershipArgumentsSchema.safeParse(args);

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

			const [currentUser, existingChat, existingMember] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatsTable.findFirst({
					with: {
						chatMembershipsWhereChat: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, parsedArgs.input.memberId),
						},
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
						operators.eq(fields.id, parsedArgs.input.chatId),
				}),

				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.memberId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingChat === undefined && existingMember === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
							{
								argumentPath: ["input", "chatId"],
							},
						],
					},
				});
			}

			if (existingChat === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "chatId"],
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

			const existingChatMembership = existingChat.chatMembershipsWhereChat[0];

			if (existingChatMembership !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "chatId"],
								message: "This chat already has the associated member.",
							},
							{
								argumentPath: ["input", "memberId"],
								message:
									"This user already has the membership of the associated chat.",
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingChat.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
			) {
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
					});
				}
			}

			const [createdChatMembership] = await ctx.drizzleClient
				.insert(chatMembershipsTable)
				.values({
					creatorId: currentUserId,
					memberId: parsedArgs.input.memberId,
					chatId: parsedArgs.input.chatId,
					role:
						parsedArgs.input.role === undefined
							? "regular"
							: parsedArgs.input.role,
				})
				.returning();

			// Inserted chat membership not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdChatMembership === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return existingChat;
		},
		type: Chat,
	}),
);
