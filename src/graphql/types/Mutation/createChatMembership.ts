import { z } from "zod";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateChatMembershipInput,
	mutationCreateChatMembershipInputSchema,
} from "~/src/graphql/inputs/MutationCreateChatMembershipInput";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const argsSchema = z.object({ input: mutationCreateChatMembershipInputSchema });

builder.mutationField("createChatMembership", (t) =>
	t.field({
		args: {
			input: t.arg({ type: MutationCreateChatMembershipInput, required: true }),
		},
		description: "Add a member to a chat.",
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		type: Chat,
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const { data: parsedArgs, error, success } = argsSchema.safeParse(args);
			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((i) => ({
							argumentPath: i.path,
							message: i.message,
						})),
					},
				});
			}

			const { chatId, memberId, role } = parsedArgs.input;
			const currentUserId = ctx.currentClient.user.id;

			const [chat, member, currentUser] = await Promise.all([
				ctx.drizzleClient.query.chatsTable.findFirst({
					with: {
						chatMembershipsWhereChat: {
							columns: { memberId: true, role: true },
							where: (fields, ops) =>
								ops.inArray(fields.memberId, [currentUserId, memberId]),
						},
						organization: {
							columns: { countryCode: true },
							with: {
								membershipsWhereOrganization: {
									columns: { role: true },
									where: (f, ops) => ops.eq(f.memberId, currentUserId),
								},
							},
						},
					},
					where: (fields, ops) => ops.eq(fields.id, chatId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (f, ops) => ops.eq(f.id, memberId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (f, ops) => ops.eq(f.id, currentUserId),
				}),
			]);

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			if (!chat) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "chatId"] }],
					},
				});
			}

			if (chat.type === "direct") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "chatId"],
								message: "Cannot add members to a direct chat.",
							},
						],
					},
				});
			}

			if (!member) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "memberId"] }],
					},
				});
			}

			const currentUserOrgRole =
				chat.organization.membershipsWhereOrganization[0];
			const currentUserChatRole = (
				chat.chatMembershipsWhereChat as { memberId: string; role?: string }[]
			).find((m) => m.memberId === currentUserId);

			const isChatCreator = chat.creatorId === currentUserId;
			const isChatAdmin = currentUserChatRole?.role === "administrator";

			const canCreate =
				currentUser.role === "administrator" ||
				isChatCreator ||
				isChatAdmin ||
				currentUserOrgRole !== undefined;
			if (!canCreate) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "chatId"] }],
					},
				});
			}

			if (
				role !== undefined &&
				role !== "regular" &&
				currentUserOrgRole === undefined
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "role"] }],
					},
				});
			}

			const [created] = await ctx.drizzleClient
				.insert(chatMembershipsTable)
				.values({
					chatId,
					memberId,
					creatorId: currentUserId,
					role: role ?? "regular",
				})
				.onConflictDoNothing()
				.returning();

			if (created === undefined) {
				return chat;
			}

			return chat;
		},
	}),
);
