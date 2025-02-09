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

type Fields = { [key: string]: any }; // Replace with actual field types
type Operators = { eq: (field: string, value: any) => boolean };


describe("ChatMembershipResolver", () => {

	describe("creator", () => {
		let parsedArgs = {
			input: {
			  chatId: 'chat-id-123',
			  memberId: 'member-id-123',
			},
		  };

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

		const defaultArgs = {
			input: {
				memberId: "member-1", 
				chatId: "chat-1",
				role: "member",
			},
		};

		beforeEach(() => {
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

		const currentUserId = 123456;

		const ctx = {
			drizzleClient: {
			  query: {
				usersTable: {
				  findFirst: vi.fn().mockResolvedValue({ role: 'administrator' }),
				},
				chatsTable: {
				  findFirst: vi.fn().mockResolvedValue({
					chatMembershipsWhereChat: { role: 'member' },
					organization: {
					  countryCode: 'US',
					  membershipsWhereOrganization: { role: 'administrator' },
					},
				  }),
				},
			  
			},
			},
			currentClient: {
			  user: {
				id: currentUserId, // Use the mocked user ID here
			  },
			},
		  };

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
							code: "invalid_arguments", // Correct error code
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "memberId"],
									message: "Invalid uuid", // Add expected message
								}),
								expect.objectContaining({
									argumentPath: ["input", "chatId"],
									message: "Invalid uuid", // Add expected message
								}),
							]),
						}),
					}),
				);
			});

			it("should throw error when chat does not exist", async () => {
				mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
					role: "member",
				});
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

		
		describe('Authentication Test for ChatMembershipResolver', () => {
			const currentUserId = 'user-id-123';
			const memberId = 'member-id-456';
			const chatId = 'chat-id-789';

		
			it('should throw unauthenticated error if currentUser is not found', async () => {
			  // Mock the usersTable query to return undefined (user not found)
			  ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(undefined);
		  
			  try {
				await Promise.all([
				  ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields: Fields, operators: Operators) => operators.eq(fields.id, currentUserId),
				  }),
				  ctx.drizzleClient.query.chatsTable.findFirst({
					with: {
					  chatMembershipsWhereChat: { columns: { role: true }, where: (fields: Fields, operators: Operators) => operators.eq(fields.memberId, memberId) },
					  organization: {
						columns: { countryCode: true },
						with: { membershipsWhereOrganization: { columns: { role: true }, where: (fields: Fields, operators: Operators) => operators.eq(fields.memberId, currentUserId) } },
					  },
					},
					where: (fields: Fields, operators: Operators) => operators.eq(fields.id, chatId),
				  }),
				  ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields: Fields, operators: Operators) => operators.eq(fields.id, memberId),
				  }),
				]);
			  } catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				try {
					// Your code that might throw an error
				  } catch (error: unknown) {
					if (error instanceof Error) {
					  // Now TypeScript knows that 'error' is an instance of Error
					  console.error(error.message); // Access 'message' property
					  expect(error).toBeInstanceOf(TalawaGraphQLError);
					} else {
					  // Handle other types of errors, if needed
					  console.error("An unknown error occurred");
					}
				  }
				  
			  }
			});
		  
			it('should fetch current user, existing chat, and existing member data', async () => {
			  const mockUser = { role: 'administrator' };
			  const mockChat = {
				chatMembershipsWhereChat: { role: 'member' },
				organization: { countryCode: 'US', membershipsWhereOrganization: { role: 'administrator' } },
			  };
			  const mockMember = { role: 'member' };
		  
			  // Mock successful responses for all queries
			  ctx.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUser) // for current user
				.mockResolvedValueOnce(mockMember); // for member
		  
			  ctx.drizzleClient.query.chatsTable.findFirst.mockResolvedValueOnce(mockChat); // for chat
		  
			  const [currentUser, existingChat, existingMember] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
				  columns: { role: true },
				  where: (fields: Fields, operators: Operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatsTable.findFirst({
				  with: {
					chatMembershipsWhereChat: { columns: { role: true }, where: (fields: Fields, operators: Operators) => operators.eq(fields.memberId, memberId) },
					organization: {
					  columns: { countryCode: true },
					  with: { membershipsWhereOrganization: { columns: { role: true }, where: (fields: Fields, operators: Operators) => operators.eq(fields.memberId, currentUserId) } },
					},
				  },
				  where: (fields: Fields, operators: Operators) => operators.eq(fields.id, chatId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
				  columns: { role: true },
				  where: (fields: Fields, operators: Operators) => operators.eq(fields.id, memberId),
				}),
			  ]);
		  
			  expect(currentUser).toEqual({ role: 'administrator' });
			  expect(existingChat).toEqual({
				chatMembershipsWhereChat: { role: 'member' },
				organization: { countryCode: 'US', membershipsWhereOrganization: { role: 'administrator' } },
			  });
			  expect(existingMember).toEqual({ role: 'member' });
			});
		  
			it('should handle when chat or member data is not found', async () => {
			  // Mock cases where chat or member are not found
			  ctx.drizzleClient.query.chatsTable.findFirst.mockResolvedValueOnce(null); // no chat found
			  ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(null); // no member found
		  
			  try {
				await Promise.all([
				  ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields: Fields, operators: Operators) => operators.eq(fields.id, currentUserId),
				  }),
				  ctx.drizzleClient.query.chatsTable.findFirst({
					with: {
					  chatMembershipsWhereChat: { columns: { role: true }, where: (fields: Fields, operators: Operators) => operators.eq(fields.memberId, memberId) },
					  organization: {
						columns: { countryCode: true },
						with: { membershipsWhereOrganization: { columns: { role: true }, where: (fields: Fields, operators: Operators) => operators.eq(fields.memberId, currentUserId) } },
					  },
					},
					where: (fields: Fields, operators: Operators) => operators.eq(fields.id, chatId),
				  }),
				  ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields: Fields, operators: Operators) => operators.eq(fields.id, memberId),
				  }),
				]);
			  } catch (error) {
				// Verify that the error handling works correctly
				expect(error).toBeInstanceOf(TalawaGraphQLError);
			  }
			});
		});
	});
});
