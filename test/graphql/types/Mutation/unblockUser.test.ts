import {
	type Mock,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { builder } from "~/src/graphql/builder";


vi.mock("~/src/graphql/builder", () => ({
	builder: {
		mutationField: vi.fn().mockReturnValue({
			args: {},
			description: "",
			resolve: vi.fn(),
			type: "",
		}),
	},
}));

import "~/src/graphql/types/Mutation/unblockUser";

describe("unblockUser Mutation", () => {
	let mockContext: {
		currentClient: {
			isAuthenticated: boolean;
			user: {
				id: string;
			};
		};
		drizzleClient: {
			query: {
				organizationsTable: {
					findFirst: Mock;
				};
				usersTable: {
					findFirst: Mock;
				};
				organizationMembershipsTable: {
					findFirst: Mock;
				};
				blockedUsersTable: {
					findFirst: Mock;
				};
			};
			transaction: Mock;
			delete: Mock;
		};
	};

	const defaultArgs = {
		organizationId: "org-1",
		userId: "user-1",
	};

	beforeEach(() => {
		mockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "admin-user-1",
				},
			},
			drizzleClient: {
				query: {
					organizationsTable: {
						findFirst: vi.fn(),
					},
					usersTable: {
						findFirst: vi.fn(),
					},
					organizationMembershipsTable: {
						findFirst: vi.fn(),
					},
					blockedUsersTable: {
						findFirst: vi.fn(),
					},
				},
				transaction: vi.fn(),
				delete: vi.fn(),
			},
		};

		vi.clearAllMocks();
	});


	const getResolver = () => {
		const mutationFieldCall = (builder.mutationField as Mock).mock.calls[0];
		const fieldConfig = mutationFieldCall![1]({});
		return fieldConfig.resolve;
	};

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			const resolver = getResolver();
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				resolver(null, defaultArgs, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Input Validation", () => {
		it("should throw invalid_arguments error if organizationId is missing", async () => {
			const resolver = getResolver();
			const args = { ...defaultArgs, organizationId: "" };

			await expect(
				resolver(null, args, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.arrayContaining(["organizationId"]),
							}),
						]),
					},
				}),
			);
		});

		it("should throw invalid_arguments error if userId is missing", async () => {
			const resolver = getResolver();
			const args = { ...defaultArgs, userId: "" };

			await expect(
				resolver(null, args, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.arrayContaining(["userId"]),
							}),
						]),
					},
				}),
			);
		});
	});

	describe("Resource Validation", () => {
		it("should throw arguments_associated_resources_not_found if organization does not exist", async () => {
			const resolver = getResolver();
			mockContext.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(null);

			await expect(
				resolver(null, defaultArgs, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.arrayContaining(["input", "organizationId"]),
							}),
						]),
					},
				}),
			);
		});

		it("should throw arguments_associated_resources_not_found if user does not exist", async () => {
			const resolver = getResolver();
			mockContext.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue({
				id: "org-1",
				name: "Test Organization",
			});
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue(null);

			await expect(
				resolver(null, defaultArgs, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.arrayContaining(["input", "userId"]),
							}),
						]),
					},
				}),
			);
		});
	});

	describe("Authorization", () => {
		it("should throw unauthorized_action if current user is not an admin of the organization", async () => {
			const resolver = getResolver();
			mockContext.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue({
				id: "org-1",
				name: "Test Organization",
			});
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				name: "Test User",
			});
			mockContext.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue({
				id: "membership-1",
				organizationId: "org-1",
				memberId: "admin-user-1",
				role: "regular",
			});

			await expect(
				resolver(null, defaultArgs, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
						message: "You must be an admin of this organization to unblock users.",
					},
				}),
			);
		});

		it("should throw unauthorized_action if current user is not a member of the organization", async () => {
			const resolver = getResolver();
			mockContext.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue({
				id: "org-1",
				name: "Test Organization",
			});
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				name: "Test User",
			});
			mockContext.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(null);

			await expect(
				resolver(null, defaultArgs, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
						message: "You must be an admin of this organization to unblock users.",
					},
				}),
			);
		});
	});

	describe("Business Logic Validation", () => {
		beforeEach(() => {
			
			mockContext.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue({
				id: "org-1",
				name: "Test Organization",
			});
			mockContext.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				name: "Test User",
			});
			mockContext.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue({
				id: "membership-admin",
				organizationId: "org-1",
				memberId: "admin-user-1",
				role: "administrator",
			});
			mockContext.drizzleClient.query.blockedUsersTable.findFirst.mockResolvedValue({
				id: "block-1",
				organizationId: "org-1",
				userId: "user-1",
			});
		});

		it("should throw forbidden_action if user is not blocked", async () => {
			const resolver = getResolver();
			mockContext.drizzleClient.query.blockedUsersTable.findFirst.mockResolvedValue(null);

			await expect(
				resolver(null, defaultArgs, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "User is not blocked.",
					},
				}),
			);
		});

		it("should successfully unblock a user", async () => {
			const resolver = getResolver();
			mockContext.drizzleClient.transaction.mockImplementation(async (callback) => {
				return await callback({
					delete: () => ({
						where: () => Promise.resolve(true),
					}),
				});
			});

			const result = await resolver(null, defaultArgs, mockContext);
			expect(result).toBe(true);
		});
	});
});