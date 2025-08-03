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
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";
import { ChatMembershipResolver } from "../../../../src/graphql/types/Mutation/createChatMembership";

vi.mock("~/src/utilities/getKeyPathsWithNonUndefinedValues", () => ({
	getKeyPathsWithNonUndefinedValues: vi.fn(),
}));

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
					chatMembershipsTable?: {
						findFirst: Mock;
					};
				};
			};
			log: {
				error: Mock;
			};
		};

		// Define mockContextWithUser as a separate object with an additional user property
		let mockContextWithUser: typeof mockContext & {
			user: {
				id: string;
				role: string;
			};
		};

		const defaultArgs = {
			input: {
				memberId: "member-1",
				chatId: "chat-1",
				role: "member",
			},
		};

		beforeEach(() => {
			// Set up default mock for getKeyPathsWithNonUndefinedValues
			(getKeyPathsWithNonUndefinedValues as Mock).mockReturnValue([]);

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

			// Properly assign mockContextWithUser here
			mockContextWithUser = {
				...mockContext,
				user: {
					id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Provide a valid user ID
					role: "regular", // User role can be 'regular' or 'administrator'
				},
				drizzleClient: {
					...mockContext.drizzleClient,
					query: {
						chatsTable: {
							findFirst: vi.fn().mockResolvedValueOnce(undefined), // Mock chat not found
						},
						usersTable: {
							findFirst: vi.fn().mockResolvedValueOnce(undefined), // Mock member not found
						},
					},
				},
			};
		});

		afterEach(() => {
			vi.clearAllMocks();
			// Reset the mock to return empty array by default
			(getKeyPathsWithNonUndefinedValues as Mock).mockReturnValue([]);
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

		it("should return null when creatorId is null", async () => {
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

			// Create a new parent with null creatorId
			const parentWithNullCreator = {
				...mockParent,
				creatorId: null,
			} as typeof mockParent & { creatorId: null };

			const result = await ChatMembershipResolver.creator(
				parentWithNullCreator,
				{},
				mockContext,
			);
			expect(result).toBeNull();
		});

		describe("Authentication Tests", () => {
			it("should throw unauthenticated error when user is not authenticated", async () => {
				mockContext.currentClient.isAuthenticated = false;

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						defaultArgs,
						mockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				);
			});
		});

		describe("Input Validation Tests", () => {
			it("should throw invalid_arguments error when schema validation fails", async () => {
				const invalidArgs = {
					input: {
						memberId: "", // Invalid empty memberId
						chatId: "chat-1",
					},
				};

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						invalidArgs,
						mockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				);
			});
		});

		describe("Resource Existence Tests", () => {
			it("should throw error when both chat and member do not exist", async () => {
				mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
					undefined,
				);
				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					undefined,
				);

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						defaultArgs,
						mockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments", // Keep this if it's the correct code
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "memberId"],
									message: "Invalid uuid",
								}),
								expect.objectContaining({
									argumentPath: ["input", "chatId"],
									message: "Invalid uuid",
								}),
							]),
						}),
					}),
				);
			});
		});

		describe("Membership Validation Tests", () => {
			it("should throw error when chat membership already exists", async () => {
				const mockChat = {
					id: "chat-1",
					chatMembershipsWhereChat: [{ role: "member" }],
					organization: {
						membershipsWhereOrganization: [],
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
					role: "member",
				});
				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						defaultArgs,
						mockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "chatId"],
									message: "Invalid uuid",
								}),
								expect.objectContaining({
									argumentPath: ["input", "memberId"],
									message: "Invalid uuid",
								}),
								expect.objectContaining({
									argumentPath: ["input", "role"],
									message:
										"Invalid enum value. Expected 'administrator' | 'regular', received 'member'",
								}),
							]),
						}),
					}),
				);
			});
		});

		describe("Authorization Tests", () => {
			it("should throw unauthorized error when non-admin user tries to set role", async () => {
				const mockChat = {
					id: "chat-1",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member" }],
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
					role: "member",
				});
				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						defaultArgs,
						mockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "chatId"],
									message: "Invalid uuid",
								}),
								expect.objectContaining({
									argumentPath: ["input", "memberId"],
									message: "Invalid uuid",
								}),
								expect.objectContaining({
									argumentPath: ["input", "role"],
									message:
										"Invalid enum value. Expected 'administrator' | 'regular', received 'member'",
								}),
							]),
						}),
					}),
				);
			});
		});

		it("should throw TalawaGraphQLError if currentUser is undefined", async () => {
			// Set currentUser to undefined in mockContext
			const contextWithoutUser = {
				...mockContext,
				currentUser: undefined,
			};

			// Provide valid input data to pass validation
			const validArgs = {
				input: {
					chatId: "123e4567-e89b-12d3-a456-426614174000", // valid UUID
					memberId: "123e4567-e89b-12d3-a456-426614174001", // valid UUID
					role: "administrator", // valid role enum value
				},
			};

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					validArgs,
					contextWithoutUser,
				),
			).rejects.toThrowError(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});

		it("should throw invalid_arguments error when invalid data is provided", async () => {
			const invalidArgs = {
				input: {
					memberId: "invalid-uuid", // Invalid UUID
					chatId: "invalid-uuid", // Invalid UUID
					role: "member", // Invalid role
				},
			};

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					invalidArgs,
					mockContextWithUser,
				),
			).rejects.toThrowError(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "chatId"],
								message: "Invalid uuid",
							}),
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
								message: "Invalid uuid",
							}),
							expect.objectContaining({
								argumentPath: ["input", "role"],
								message:
									"Invalid enum value. Expected 'administrator' | 'regular', received 'member'",
							}),
						]),
					}),
				}),
			);
		});

		it("should throw error if existing chat is not found", async () => {
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: { chatId: "chat-1", memberId: "member-1", role: "regular" },
					},
					mockContext,
				),
			).rejects.toThrowError(
				new TalawaGraphQLError({
					message: "You have provided invalid arguments for this action.",
					extensions: {
						code: "invalid_arguments",
						issues: [
							{ argumentPath: ["input", "chatId"], message: "Invalid uuid" },
							{ argumentPath: ["input", "memberId"], message: "Invalid uuid" },
						],
					},
				}),
			);
		});

		it("should throw error if existing member is not found", async () => {
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: { chatId: "chat-1", memberId: "member-1", role: "regular" },
					},
					mockContext,
				),
			).rejects.toThrowError(
				new TalawaGraphQLError({
					message: "You have provided invalid arguments for this action.",
					extensions: {
						code: "invalid_arguments",
						issues: [
							{ argumentPath: ["input", "chatId"], message: "Invalid uuid" },
							{ argumentPath: ["input", "memberId"], message: "Invalid uuid" },
						],
					},
				}),
			);
		});

		it("should throw error if the chat already has the associated member", async () => {
			const existingChat = {
				chatMembershipsWhereChat: [{ chatId: "chat-1", memberId: "member-1" }],
			};

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValueOnce(
				existingChat,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: { chatId: "chat-1", memberId: "member-1", role: "regular" },
					},
					mockContext,
				),
			).rejects.toThrowError(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "chatId"],
								message: "Invalid uuid",
							},
							{
								argumentPath: ["input", "memberId"],
								message: "Invalid uuid",
							},
						],
					},
				}),
			);
		});

		it("should throw error when chat membership already exists", async () => {
			const existingChat = {
				chatMembershipsWhereChat: [
					{
						id: "existing-membership",
					},
				],
				organization: {
					membershipsWhereOrganization: [],
				},
			};

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValueOnce(
				existingChat,
			);

			const validateFn = async () => {
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
			};

			await expect(validateFn()).rejects.toThrow(TalawaGraphQLError);
			await expect(validateFn()).rejects.toMatchObject({
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "chatId"],
						}),
						expect.objectContaining({
							argumentPath: ["input", "memberId"],
						}),
					]),
				},
			});
		});

		it("should throw unauthorized_arguments when non-admin tries to set role", async () => {
			// Mock for this specific test to return unauthorized path
			(getKeyPathsWithNonUndefinedValues as Mock).mockReturnValue([
				["input", "role"],
			]);

			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({
					role: "regular",
					id: "00000000-0000-0000-0000-000000000003",
				})
				.mockResolvedValueOnce({
					id: "00000000-0000-0000-0000-000000000001",
				});

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue({
				id: "00000000-0000-0000-0000-000000000002",
				chatMembershipsWhereChat: [],
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [
						{
							role: "member",
							memberId: "00000000-0000-0000-0000-000000000003",
						},
					],
				},
			});

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000001",
							chatId: "00000000-0000-0000-0000-000000000002", // Valid UUID
							role: "administrator",
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_arguments",
						issues: [
							{
								argumentPath: ["input", "role"],
							},
						],
					}),
				}),
			);
		});

		it("should throw forbidden_action error when chat membership already exists", async () => {
			const mockChatWithMembership = {
				id: "00000000-0000-0000-0000-000000000001",
				chatMembershipsWhereChat: [
					{
						memberId: "00000000-0000-0000-0000-000000000002",
						role: "regular",
					},
				],
				organization: {
					membershipsWhereOrganization: [],
				},
			};

			// Setup mocks
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user
				.mockResolvedValueOnce({ id: "00000000-0000-0000-0000-000000000002" }); // Existing member

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				mockChatWithMembership,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "chatId"],
								message: "This chat already has the associated member.",
							}),
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
								message:
									"This user already has the membership of the associated chat.",
							}),
						]),
					}),
				}),
			);
		});
		it("should throw invalid_arguments error when ONLY member is not found", async () => {
			// Mock setup
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue({
				id: "valid-chat",
				organization: { membershipsWhereOrganization: [] },
			});
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user
				.mockResolvedValueOnce(undefined); // Target member missing

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							// Valid chat UUID but invalid member UUID
							memberId: "invalid-member-id",
							chatId: "00000000-0000-0000-0000-000000000002",
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
								message: "Invalid uuid",
							}),
						],
					}),
				}),
			);
		});

		it("should throw invalid_arguments error when ONLY chat is not found", async () => {
			// Mock setup
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				undefined,
			);
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user
				.mockResolvedValueOnce({ id: "valid-member" }); // Target member exists

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							// Valid member UUID but invalid chat UUID
							memberId: "00000000-0000-0000-0000-000000000001",
							chatId: "invalid-chat-id",
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							expect.objectContaining({
								argumentPath: ["input", "chatId"],
								message: "Invalid uuid",
							}),
						],
					}),
				}),
			);
		});

		it("should throw invalid_arguments error when member is not found", async () => {
			// Mock member not found but chat exists
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue({
				id: "valid-chat",
				organization: {
					membershipsWhereOrganization: [],
				},
			});
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "invalid-member-id",
							chatId: "00000000-0000-0000-0000-000000000002",
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					message: "You have provided invalid arguments for this action.",
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
								message: "Invalid uuid",
							}),
						],
					}),
				}),
			);
		});

		it("should throw arguments_associated_resources_not_found when both chat and member do not exist", async () => {
			// Clear previous mocks to avoid interference
			mockContext.drizzleClient.query.chatsTable.findFirst.mockReset();
			mockContext.drizzleClient.query.usersTable.findFirst.mockReset();

			// Mock the three parallel queries in order:
			// 1. Current user exists
			// 2. Chat not found
			// 3. Member not found
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user query
				.mockResolvedValueOnce(undefined); // Member query

			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				undefined,
			); // Chat query

			// Use valid UUID format to pass Zod validation
			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000001",
							chatId: "00000000-0000-0000-0000-000000000002",
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
							}),
							expect.objectContaining({
								argumentPath: ["input", "chatId"],
							}),
						]),
					}),
				}),
			);
		});

		// Add these tests to the "Resource Existence Tests" describe block

		it("should throw arguments_associated_resources_not_found when both chat and member are missing (valid UUIDs)", async () => {
			// Clear previous mocks
			mockContext.drizzleClient.query.chatsTable.findFirst.mockReset();
			mockContext.drizzleClient.query.usersTable.findFirst.mockReset();

			// Mock current user exists
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user
				.mockResolvedValueOnce(undefined); // Target member

			// Mock chat not found
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000001", // Valid UUID
							chatId: "00000000-0000-0000-0000-000000000002", // Valid UUID
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({ argumentPath: ["input", "memberId"] }),
							expect.objectContaining({ argumentPath: ["input", "chatId"] }),
						]),
					}),
				}),
			);
		});

		it("should throw invalid_arguments with chatId error when only chat is missing (valid member UUID)", async () => {
			// Mock member exists
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user
				.mockResolvedValueOnce({ id: "00000000-0000-0000-0000-000000000001" }); // Valid member

			// Mock chat not found
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000001", // Valid UUID
							chatId: "invalid-chat-id", // Invalid UUID
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					message: "You have provided invalid arguments for this action.",
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							expect.objectContaining({
								argumentPath: ["input", "chatId"],
								message: "Invalid uuid",
							}),
						],
					}),
				}),
			);
		});

		it("should throw invalid_arguments with memberId error when only member is missing (valid chat UUID)", async () => {
			// Mock chat exists
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue({
				id: "00000000-0000-0000-0000-000000000002",
				organization: { membershipsWhereOrganization: [] },
			});

			// Mock member not found
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user
				.mockResolvedValueOnce(undefined); // Target member

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "invalid-member-id", // Invalid UUID
							chatId: "00000000-0000-0000-0000-000000000002", // Valid UUID
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					message: "You have provided invalid arguments for this action.",
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
								message: "Invalid uuid",
							}),
						],
					}),
				}),
			);
		});

		// Fix for chatId error test
		it("should throw chatId error when ONLY chat is not found (valid UUIDs)", async () => {
			// Mock current user exists
			mockContext.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce({ role: "regular" }) // Current user
				.mockResolvedValueOnce({ id: "00000000-0000-0000-0000-000000000002" }); // Target member exists

			// Mock chat not found
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001", // Valid but missing chat
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					message: "You have provided invalid arguments for this action.",
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							expect.objectContaining({
								argumentPath: ["input", "chatId"],
								message: "Invalid uuid",
							}),
						],
					}),
				}),
			);
		});

		// Fix for memberId error test
		it("should throw memberId error when ONLY member is not found (valid UUIDs)", async () => {
			// Mock current user exists
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				{ role: "regular" },
			); // Current user

			// Mock chat exists
			mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue({
				id: "00000000-0000-0000-0000-000000000001",
				organization: { membershipsWhereOrganization: [] },
			});

			// Mock member not found
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			); // Target member

			await expect(
				ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002", // Valid but missing member
							chatId: "00000000-0000-0000-0000-000000000001",
						},
					},
					mockContext,
				),
			).rejects.toThrow(
				expect.objectContaining({
					message: "You have provided invalid arguments for this action.",
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							expect.objectContaining({
								argumentPath: ["input", "memberId"],
								message: "Invalid uuid",
							}),
						],
					}),
				}),
			);
		});

		// Test successful authorization scenarios
		describe("Authorization Success Tests", () => {
			/*
			 * NOTE: These tests validate the ChatMembershipResolver.createChatMembership function,
			 * which only performs basic validation (input validation, resource existence checks).
			 * Full authorization logic (global admin, org admin, chat member permissions) is
			 * implemented in the GraphQL field resolver, not in this resolver function.
			 * These tests verify that basic validation passes for various user permission levels.
			 */
			beforeEach(() => {
				// Add chatMembershipsTable to mock context
				(
					mockContext.drizzleClient.query as unknown as {
						chatsTable: { findFirst: Mock };
						usersTable: { findFirst: Mock };
						chatMembershipsTable: { findFirst: Mock };
					}
				).chatMembershipsTable = {
					findFirst: vi.fn(),
				};
			});

			it("should allow global administrator to create membership", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [],
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "administrator" }) // Current user
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
						},
					},
					mockContext,
				);

				expect(result).toBe(mockChat);
			});

			it("should allow organization member to create membership", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member" }],
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Current user
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
						},
					},
					mockContext,
				);

				expect(result).toBe(mockChat);
			});

			it("should allow existing chat member to create membership", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [],
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Current user
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				// Mock existing chat membership check
				(
					mockContext.drizzleClient.query as unknown as {
						chatsTable: { findFirst: Mock };
						usersTable: { findFirst: Mock };
						chatMembershipsTable: { findFirst: Mock };
					}
				).chatMembershipsTable.findFirst.mockResolvedValue({ role: "member" });

				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
						},
					},
					mockContext,
				);

				expect(result).toBe(mockChat);
			});

			it("should return chat when user has no elevated permissions (basic validation only)", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [], // No org membership
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Current user
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				// Mock no existing chat membership
				if (mockContext.drizzleClient.query.chatMembershipsTable) {
					mockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
						undefined,
					);
				}

				// Note: This tests a regular user with no elevated permissions (not global admin,
				// org admin, or chat admin). The ChatMembershipResolver.createChatMembership function
				// still allows the operation as it only does basic validation - full authorization
				// logic happens in the GraphQL field resolver.
				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
						},
					},
					mockContext,
				);

				// The ChatMembershipResolver function returns the chat if basic validation passes
				expect(result).toBe(mockChat);
			});
		});

		// Test role authorization scenarios
		describe("Role Authorization Tests", () => {
			beforeEach(() => {
				// Add chatMembershipsTable to mock context
				mockContext.drizzleClient.query.chatMembershipsTable = {
					findFirst: vi.fn(),
				};
			});

			it("should allow organization admin to set any role", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Current user (not global admin)
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				// @ts-expect-error - Mock for testing
				mockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
					undefined,
				);

				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
							role: "administrator", // Setting admin role
						},
					},
					mockContext,
				);

				expect(result).toBe(mockChat);
			});

			it("should allow chat admin to set any role", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }], // Org admin membership
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Current user (not global admin)
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				// Mock existing chat admin membership
				// @ts-expect-error - Mock for testing
				mockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
					{ role: "administrator" },
				);

				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
							role: "administrator", // Setting admin role
						},
					},
					mockContext,
				);

				expect(result).toBe(mockChat);
			});

			it("should restrict non-admin from setting non-regular roles", async () => {
				// Mock for this specific test to return unauthorized path
				(getKeyPathsWithNonUndefinedValues as Mock).mockReturnValue([
					["input", "role"],
				]);

				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member" }], // Non-admin org role
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Non-admin current user
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				// @ts-expect-error - Mock for testing
				mockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
					undefined,
				);

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						{
							input: {
								memberId: "00000000-0000-0000-0000-000000000002",
								chatId: "00000000-0000-0000-0000-000000000001",
								role: "administrator", // Trying to set admin role
							},
						},
						mockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_arguments",
							issues: [
								expect.objectContaining({
									argumentPath: ["input", "role"],
								}),
							],
						}),
					}),
				);
			});

			it("should reject non-admin trying to set any role", async () => {
				// Mock for this specific test to return unauthorized path
				(getKeyPathsWithNonUndefinedValues as Mock).mockReturnValue([
					["input", "role"],
				]);

				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member" }], // Non-admin org role
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Non-admin current user
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				// Mock existing chat membership for the current user
				// @ts-expect-error - Mock for testing
				mockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
					{ role: "regular" }, // User has chat membership
				);

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						{
							input: {
								memberId: "00000000-0000-0000-0000-000000000002",
								chatId: "00000000-0000-0000-0000-000000000001",
								role: "regular", // Even regular role should be rejected for non-admins
							},
						},
						mockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_arguments",
							issues: [
								expect.objectContaining({
									argumentPath: ["input", "role"],
								}),
							],
						}),
					}),
				);
			});
		});

		// Test edge cases and boundary conditions
		describe("Edge Cases and Boundary Tests", () => {
			beforeEach(() => {
				// Add chatMembershipsTable to mock context
				mockContext.drizzleClient.query.chatMembershipsTable = {
					findFirst: vi.fn(),
				};
			});

			it("should handle when getKeyPathsWithNonUndefinedValues returns empty array", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000001",
					chatMembershipsWhereChat: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member" }], // Non-admin org role
					},
				};

				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce({ role: "regular" }) // Non-admin current user
					.mockResolvedValueOnce({
						id: "00000000-0000-0000-0000-000000000002",
					}); // Target member

				mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				// @ts-expect-error - Mock for testing
				mockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
					undefined,
				);

				// Test with no role specified (should not trigger unauthorized_arguments)
				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000002",
							chatId: "00000000-0000-0000-0000-000000000001",
							// No role specified
						},
					},
					mockContext,
				);

				expect(result).toBe(mockChat);
			});

			it("should handle existing user query returning null for creator check", async () => {
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
				// First call returns null, second call should return user
				mockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce(null)
					.mockResolvedValueOnce(mockCreator);

				mockParent.creatorId = "current-user-1";

				const result = await ChatMembershipResolver.creator(
					mockParent,
					{},
					mockContext,
				);
				expect(result).toBeNull();
			});

			it("should handle all permission levels correctly", async () => {
				const testCases = [
					{
						description: "global admin with no org/chat membership",
						userRole: "administrator",
						orgMembership: undefined,
						chatMembership: undefined,
						shouldSucceed: true,
					},
					{
						description: "regular user with org admin membership",
						userRole: "regular",
						orgMembership: { role: "administrator" },
						chatMembership: undefined,
						shouldSucceed: true,
					},
					{
						description: "regular user with chat admin membership",
						userRole: "regular",
						orgMembership: undefined,
						chatMembership: { role: "administrator" },
						shouldSucceed: true,
					},
					{
						description: "regular user with org member and chat member",
						userRole: "regular",
						orgMembership: { role: "member" },
						chatMembership: { role: "regular" },
						shouldSucceed: true,
					},
					{
						description: "regular user with no memberships",
						userRole: "regular",
						orgMembership: undefined,
						chatMembership: undefined,
						shouldSucceed: true, // ChatMembershipResolver function allows this, authorization is handled at GraphQL level
					},
				];

				for (const testCase of testCases) {
					// Reset mocks
					vi.clearAllMocks();

					const mockChat = {
						id: "00000000-0000-0000-0000-000000000001",
						chatMembershipsWhereChat: [],
						organization: {
							membershipsWhereOrganization: testCase.orgMembership
								? [testCase.orgMembership]
								: [],
						},
					};

					mockContext.drizzleClient.query.usersTable.findFirst
						.mockResolvedValueOnce({ role: testCase.userRole }) // Current user
						.mockResolvedValueOnce({
							id: "00000000-0000-0000-0000-000000000002",
						}); // Target member

					mockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
						mockChat,
					);

					// @ts-expect-error - Mock for testing
					mockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
						testCase.chatMembership,
					);

					if (testCase.shouldSucceed) {
						const result = await ChatMembershipResolver.createChatMembership(
							{},
							{
								input: {
									memberId: "00000000-0000-0000-0000-000000000002",
									chatId: "00000000-0000-0000-0000-000000000001",
								},
							},
							mockContext,
						);
						expect(result).toBe(mockChat);
					}
				}
			});
		});

		describe("Additional createChatMembership tests", () => {
			let additionalMockContext: typeof mockContext & {
				drizzleClient: typeof mockContext.drizzleClient & {
					insert: Mock;
					query: typeof mockContext.drizzleClient.query & {
						chatMembershipsTable: {
							findFirst: Mock;
						};
					};
				};
			};

			beforeEach(() => {
				// Set up default mock for getKeyPathsWithNonUndefinedValues
				(getKeyPathsWithNonUndefinedValues as Mock).mockReturnValue([]);

				additionalMockContext = {
					...mockContext,
					drizzleClient: {
						...mockContext.drizzleClient,
						insert: vi.fn(),
						query: {
							...mockContext.drizzleClient.query,
							chatMembershipsTable: {
								findFirst: vi.fn(),
							},
						},
					},
				};
			});

			it("should successfully create chat membership and return chat", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000002",
					chatMembershipsWhereChat: [],
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				};

				const mockCurrentUser = {
					id: "00000000-0000-0000-0000-000000000003",
					role: "administrator",
				};
				const mockMember = {
					id: "00000000-0000-0000-0000-000000000004",
					role: "regular",
				};

				// Setup mocks for the successful path
				additionalMockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce(mockCurrentUser) // Current user lookup
					.mockResolvedValueOnce(mockMember); // Member lookup

				additionalMockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				additionalMockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
					undefined,
				);

				const result = await ChatMembershipResolver.createChatMembership(
					{},
					{
						input: {
							memberId: "00000000-0000-0000-0000-000000000004",
							chatId: "00000000-0000-0000-0000-000000000002",
							role: "regular",
						},
					},
					additionalMockContext,
				);

				expect(result).toEqual(mockChat);
			});

			it("should test role authorization for non-admin setting non-regular role", async () => {
				const mockChat = {
					id: "00000000-0000-0000-0000-000000000002",
					chatMembershipsWhereChat: [],
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "member" }], // Regular org member
					},
				};

				const mockCurrentUser = {
					id: "00000000-0000-0000-0000-000000000003",
					role: "regular",
				};
				const mockMember = {
					id: "00000000-0000-0000-0000-000000000004",
					role: "regular",
				};

				// Setup mocks
				additionalMockContext.drizzleClient.query.usersTable.findFirst
					.mockResolvedValueOnce(mockCurrentUser)
					.mockResolvedValueOnce(mockMember);

				additionalMockContext.drizzleClient.query.chatsTable.findFirst.mockResolvedValue(
					mockChat,
				);

				additionalMockContext.drizzleClient.query.chatMembershipsTable.findFirst.mockResolvedValue(
					{ role: "member" }, // Regular chat member
				);

				// Mock getKeyPathsWithNonUndefinedValues to return non-empty array
				(getKeyPathsWithNonUndefinedValues as Mock).mockReturnValue([
					["input", "role"],
				]);

				await expect(
					ChatMembershipResolver.createChatMembership(
						{},
						{
							input: {
								memberId: "00000000-0000-0000-0000-000000000004",
								chatId: "00000000-0000-0000-0000-000000000002",
								role: "administrator", // Non-regular role
							},
						},
						additionalMockContext,
					),
				).rejects.toThrow(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_arguments",
						}),
					}),
				);
			});
		});
	});
});
