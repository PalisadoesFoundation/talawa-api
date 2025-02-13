import { z } from "zod";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateChatMembershipInput,
	mutationCreateChatMembershipInputSchema,
} from "~/src/graphql/inputs/MutationCreateChatMembershipInput";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";
interface ChatMembershipDatabaseRecord {
	id: string;
	chatId: string;
	memberId: string;
	creatorId: string;
}

interface QueryOperators {
	eq: <T>(field: T, value: T) => boolean;
}

interface ChatMembershipRole {
	role: string;
}

interface ChatWithMemberships extends Chat {
	chatMembershipsWhereChat: ChatMembershipRole[];
	organization: {
		countryCode: string;
		membershipsWhereOrganization: {
			role: string;
		}[];
	};
}

interface Context {
	currentClient: {
		isAuthenticated: boolean;
		user: {
			id: string;
		};
	};
	drizzleClient: {
		query: {
			chatsTable: {
				findFirst: (params: {
					with?: {
						chatMembershipsWhereChat?: {
							columns: {
								role: boolean;
							};
							where: (
								fields: ChatMembershipDatabaseRecord,
								operators: QueryOperators,
							) => boolean;
						};
						organization?: {
							columns: {
								countryCode: boolean;
							};
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: boolean;
									};
									where: (
										fields: ChatMembershipDatabaseRecord,
										operators: QueryOperators,
									) => boolean;
								};
							};
						};
					};
					where: (
						fields: ChatMembershipDatabaseRecord,
						operators: QueryOperators,
					) => boolean;
				}) => Promise<ChatWithMemberships | undefined>;
			};
			usersTable: {
				findFirst: (params: {
					columns: {
						role: boolean;
					};
					where: (
						fields: ChatMembershipDatabaseRecord,
						operators: QueryOperators,
					) => boolean;
				}) => Promise<User | undefined>;
			};
		};
	};
	log: {
		error: (message: string) => void;
	};
}

export const ChatMembershipResolver = {
	creator: async (
		_parent: ChatMembershipDatabaseRecord,
		_args: Record<string, never>,
		ctx: Context,
	): Promise<User | null> => {
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		const chat = await ctx.drizzleClient.query.chatsTable.findFirst({
			with: {
				organization: {
					columns: { countryCode: true },
					with: {
						membershipsWhereOrganization: {
							columns: { role: true },
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
				},
			},
			where: (fields, operators) => operators.eq(fields.id, _parent.chatId),
		});

		if (!chat) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action",
				},
			});
		}

		if (!_parent.creatorId) {
			return null;
		}

		if (_parent.creatorId === currentUserId) {
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});
			return currentUser || null;
		}

		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			columns: { role: true },
			where: (fields, operators) => operators.eq(fields.id, _parent.creatorId),
		});

		if (!existingUser) {
			ctx.log.error(
				`Postgres select operation returned an empty array for chat membership ${_parent.id}'s creatorId (${_parent.creatorId}) that isn't null.`,
			);
			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		return existingUser;
	},

	createChatMembership: async (
		_parent: unknown,
		args: {
			input: {
				memberId: string;
				chatId: string;
				role?: string;
			};
		},
		ctx: Context,
	) => {
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
				message: "You have provided invalid arguments for this action.",
				extensions: {
					code: "invalid_arguments",
					issues: [
						{ argumentPath: ["input", "chatId"], message: "Invalid uuid" },
					],
				},
			});
		}

		if (existingMember === undefined) {
			throw new TalawaGraphQLError({
				message: "You have provided invalid arguments for this action.",
				extensions: {
					code: "invalid_arguments",
					issues: [
						{ argumentPath: ["input", "memberId"], message: "Invalid uuid" },
					],
				},
			});
		}

		const existingChatMembership = existingChat.chatMembershipsWhereChat[0];

		if (existingChatMembership !== undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources", // Correct error code
					issues: [
						{
							argumentPath: ["input", "chatId"],
							message: "This chat already has the associated member.", // Correct message for chatId
						},
						{
							argumentPath: ["input", "memberId"],
							message:
								"This user already has the membership of the associated chat.", // Correct message for memberId
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

		return existingChat;
	},
};

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
