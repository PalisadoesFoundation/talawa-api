import { describe, expect, it, vi } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ChatMembershipResolver } from "../../../../src/graphql/types/Mutation/createChatMembership";

describe("ChatMembershipResolver", () => {
	describe("creator", () => {
		const mockParent = {
			id: "chat-membership-1",
			chatId: "chat-1",
			memberId: "member-1",
			role: "regular",
			creatorId: "creator-1",
		};

		const mockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "current-user-1",
				},
			},
			drizzleClient: {
				query: {
					chatsTable: {
						findFirst: vi.fn(),
					},
					usersTable: {
						findFirst: vi.fn(),
					},
				},
			},
			log: {
				error: vi.fn(),
			},
		};

		it("should throw unauthenticated error when user is not authenticated", async () => {
			const context = {
				...mockContext,
				currentClient: {
					isAuthenticated: false,
					user: { id: "current-user-1" },
				},
			};

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, context),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});

		it("should throw forbidden action error when chat is not found", async () => {
			const context = {
				...mockContext,
				drizzleClient: {
					query: {
						chatsTable: {
							findFirst: vi.fn().mockResolvedValue(undefined),
						},
						usersTable: {
							findFirst: vi.fn(),
						},
					},
				},
			};

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, context),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action",
					}),
				}),
			);
		});

		it("should return current user when creatorId matches current user", async () => {
			const parentWithCurrentUser = {
				...mockParent,
				creatorId: "current-user-1",
			};

			const mockChat = {
				id: "chat-1",
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			};

			const mockUser = {
				id: "current-user-1",
				role: "regular",
			};

			const context = {
				...mockContext,
				drizzleClient: {
					query: {
						chatsTable: {
							findFirst: vi.fn().mockResolvedValue(mockChat),
						},
						usersTable: {
							findFirst: vi.fn().mockResolvedValue(mockUser),
						},
					},
				},
			};

			const result = await ChatMembershipResolver.creator(
				parentWithCurrentUser,
				{},
				context,
			);
			expect(result).toEqual(mockUser);
		});

		it("should return creator user when found", async () => {
			const mockChat = {
				id: "chat-1",
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			};

			const mockCreator = {
				id: "creator-1",
				role: "administrator",
			};

			const context = {
				...mockContext,
				drizzleClient: {
					query: {
						chatsTable: {
							findFirst: vi.fn().mockResolvedValue(mockChat),
						},
						usersTable: {
							findFirst: vi.fn().mockResolvedValue(mockCreator),
						},
					},
				},
			};

			const result = await ChatMembershipResolver.creator(
				mockParent,
				{},
				context,
			);
			expect(result).toEqual(mockCreator);
		});

		it("should throw unexpected error when creator user is not found", async () => {
			const mockChat = {
				id: "chat-1",
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			};

			const context = {
				...mockContext,
				drizzleClient: {
					query: {
						chatsTable: {
							findFirst: vi.fn().mockResolvedValue(mockChat),
						},
						usersTable: {
							findFirst: vi.fn().mockResolvedValue(undefined),
						},
					},
				},
			};

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, context),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
				}),
			);

			expect(context.log.error).toHaveBeenCalledWith(
				expect.stringContaining(
					"Postgres select operation returned an empty array",
				),
			);
		});

		it("should handle error logging when creator lookup fails", async () => {
			const mockChat = {
				id: "chat-1",
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			};

			const context = {
				...mockContext,
				drizzleClient: {
					query: {
						chatsTable: {
							findFirst: vi.fn().mockResolvedValue(mockChat),
						},
						usersTable: {
							findFirst: vi.fn().mockRejectedValue(new Error("Database error")),
						},
					},
				},
			};

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, context),
			).rejects.toThrow();
		});
	});
});
