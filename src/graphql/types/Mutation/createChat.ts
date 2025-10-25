import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateChatInput,
	mutationCreateChatInputSchema,
} from "~/src/graphql/inputs/MutationCreateChatInput";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
const mutationCreateChatArgumentsSchema = z.object({
	input: mutationCreateChatInputSchema.transform(async (arg, ctx) => {
		let avatar:
			| (FileUpload & {
					mimetype: z.infer<typeof imageMimeTypeEnum>;
			  })
			| null
			| undefined;

		if (isNotNullish(arg.avatar)) {
			const rawAvatar = await arg.avatar;
			const { data, success } = imageMimeTypeEnum.safeParse(rawAvatar.mimetype);

			if (!success) {
				ctx.addIssue({
					code: "custom",
					path: ["avatar"],
					message: `Mime type "${rawAvatar.mimetype}" is not allowed.`,
				});
			} else {
				avatar = Object.assign(rawAvatar, {
					mimetype: data,
				});
			}
		} else if (arg.avatar !== undefined) {
			avatar = null;
		}

		return {
			...arg,
			avatar,
		};
	}),
});

builder.mutationField("createChat", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateChatInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a chat.",
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
			} = await mutationCreateChatArgumentsSchema.safeParseAsync(args);

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

			const [currentUser, existingOrganization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
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

			const currentUserOrganizationMembership =
				existingOrganization.membershipsWhereOrganization[0];

			if (currentUserOrganizationMembership === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
				});
			}

			let avatarMimeType: z.infer<typeof imageMimeTypeEnum>;
			let avatarName: string;

			if (isNotNullish(parsedArgs.input.avatar)) {
				avatarName = ulid();
				avatarMimeType = parsedArgs.input.avatar.mimetype;
			}

			const participants = parsedArgs.input.participants;
			const chatType = parsedArgs.input.type;

			// Validate chat type and participants
			if (chatType === "direct") {
				if (!Array.isArray(participants) || participants.length !== 2) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "participants"],
									message: "Direct chats must have exactly 2 participants.",
								},
							],
						},
					});
				}
				const [a, b] = participants as [string, string];
				if (a === b) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "participants"],
									message:
										"Cannot create a direct chat with the same user as both participants.",
								},
							],
						},
					});
				}

				const [p1, p2] = a < b ? [a, b] : [b, a];
				const participantsHash = `${p1}:${p2}`;

				return await ctx.drizzleClient.transaction(async (tx) => {
					const [maybeCreated] = await tx
						.insert(chatsTable)
						.values({
							avatarMimeType,
							avatarName,
							creatorId: currentUserId,
							description: parsedArgs.input.description,
							name: parsedArgs.input.name,
							organizationId: parsedArgs.input.organizationId,
							type: chatType,
							directParticipantsHash: participantsHash,
						})
						.returning();

					if (maybeCreated !== undefined) {
						await tx
							.insert(chatMembershipsTable)
							.values([
								{
									chatId: maybeCreated.id,
									memberId: p1,
									creatorId: currentUserId,
									role: "regular",
								},
								{
									chatId: maybeCreated.id,
									memberId: p2,
									creatorId: currentUserId,
									role: "regular",
								},
							])
							.onConflictDoNothing();

						if (isNotNullish(parsedArgs.input.avatar)) {
							await ctx.minio.client.putObject(
								ctx.minio.bucketName,
								avatarName,
								parsedArgs.input.avatar.createReadStream(),
								undefined,
								{
									"content-type": parsedArgs.input.avatar.mimetype,
								},
							);
						}

						return maybeCreated;
					}
					const existingChat = await tx.query.chatsTable.findFirst({
						where: (fields, operators) =>
							operators.and(
								operators.eq(
									fields.organizationId,
									parsedArgs.input.organizationId,
								),
								operators.eq(fields.directParticipantsHash, participantsHash),
								operators.eq(fields.type, "direct"),
							),
					});
					if (!existingChat) {
						throw new TalawaGraphQLError({
							extensions: { code: "unexpected" },
							message: "Failed to create or find direct chat.",
						});
					}

					await tx
						.insert(chatMembershipsTable)
						.values([
							{
								chatId: existingChat.id,
								memberId: p1,
								creatorId: currentUserId,
								role: "regular",
							},
							{
								chatId: existingChat.id,
								memberId: p2,
								creatorId: currentUserId,
								role: "regular",
							},
						])
						.onConflictDoNothing();

					return existingChat;
				});
			}

			if (chatType === "group") {
				return await ctx.drizzleClient.transaction(async (tx) => {
					const [createdChat] = await tx
						.insert(chatsTable)
						.values({
							avatarMimeType,
							avatarName,
							creatorId: currentUserId,
							description: parsedArgs.input.description,
							name: parsedArgs.input.name,
							organizationId: parsedArgs.input.organizationId,
							type: "group",
						})
						.returning();

					if (createdChat === undefined) {
						ctx.log.error(
							"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
						);
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					if (isNotNullish(parsedArgs.input.avatar)) {
						await ctx.minio.client.putObject(
							ctx.minio.bucketName,
							avatarName,
							parsedArgs.input.avatar.createReadStream(),
							undefined,
							{
								"content-type": parsedArgs.input.avatar.mimetype,
							},
						);
					}
					await tx
						.insert(chatMembershipsTable)
						.values({
							chatId: createdChat.id,
							memberId: currentUserId,
							creatorId: currentUserId,
							role: "administrator",
						})
						.onConflictDoNothing();
					if (Array.isArray(participants) && participants.length > 0) {
						await tx
							.insert(chatMembershipsTable)
							.values(
								participants.map((participantId) => ({
									chatId: createdChat.id,
									memberId: participantId,
									creatorId: currentUserId,
									role: "regular" as const,
								}))
							)
							.onConflictDoNothing();
					}

					return createdChat;
				});
			}
			throw new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["input", "type"],
							message: "Invalid chat type. Must be 'direct' or 'group'.",
						},
					],
				},
			});
		},
		type: Chat,
	}),
);
