import {
	type Mock,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ChatMembershipResolver } from "../../../../src/graphql/types/Mutation/createChatMembership";

describe("ChatMembershipResolver", () => {
	describe("creator", () => {
		let mockParent: {
			id: string;
			chatId: string;
			memberId: string;
			role: string;
			creatorId: string;
		};
		let mockContext: {
			currentClient: {
				isAuthenticated: boolean;
				user: {
					id: string;
				};
			};
			drizzleClient: {
				query: {
					chatsTable: {
						findFirst: Mock;
					};
					usersTable: {
						findFirst: Mock;
					};
				};
			};
			log: {
				error: Mock;
			};
		};

		beforeEach(() => {
			// Set up fresh mock data before each test
			mockParent = {
				id: "chat-membership-1",
				chatId: "chat-1",
				memberId: "member-1",
				role: "regular",
				creatorId: "creator-1",
			};

			mockContext = {
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
		});

		afterEach(() => {
			vi.clearAllMocks();
		});

		it("should throw unauthenticated error when user is not authenticated", async () => {
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, mockContext),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, mockContext),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});

		it("should throw forbidden action error when chat is not found", async () => {
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, mockContext),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, mockContext),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action",
					}),
				}),
			);
		});

		it("should return current user when creatorId matches current user", async () => {
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

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				mockChat,
			);
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);
			mockParent.creatorId = "current-user-1";

			const result = await ChatMembershipResolver.creator(
				mockParent,
				{},
				mockContext,
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

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				mockChat,
			);
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockCreator,
			);

			const result = await ChatMembershipResolver.creator(
				mockParent,
				{},
				mockContext,
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

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				mockChat,
			);
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, mockContext),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				ChatMembershipResolver.creator(mockParent, {}, mockContext),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
				}),
			);

			expect(mockContext.log.error).toHaveBeenCalledWith(
				expect.stringContaining(
					"Postgres select operation returned an empty array",
				),
			);
		});
	});
});
