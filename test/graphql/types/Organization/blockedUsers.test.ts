import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { Organization as OrganizationType } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "~/src/graphql/types/Organization/Organization";

vi.mock("~/src/graphql/types/Organization/Organization", () => ({
	Organization: {
		implement: vi.fn(),
	},
}));

import "~/src/graphql/types/Organization/blockedUsers";

describe("Organization.blockedUsers Field", () => {
	let mockContext: {
		currentClient: {
			isAuthenticated: boolean;
			user: {
				id: string;
			};
		};
		drizzleClient: {
			query: {
				blockedUsersTable: {
					findMany: Mock;
				};
			};
		};
	};

	let mockOrganization: OrganizationType;

	beforeEach(() => {
		mockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "user-1",
				},
			},
			drizzleClient: {
				query: {
					blockedUsersTable: {
						findMany: vi.fn(),
					},
				},
			},
		};

		mockOrganization = {
			id: "org-1",
			name: "Test Organization",
			description: "Test Description",
			creatorId: "creator-1",
			createdAt: new Date("2024-02-07T10:30:00.000Z"),
			updatedAt: new Date("2024-02-07T12:00:00.000Z"),
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			updaterId: null,
			state: null,
			postalCode: null,
		};

		vi.clearAllMocks();
	});

	const getResolver = () => {
		const implementCall = (Organization.implement as Mock).mock.calls[0];
		const fieldsFunction = implementCall![0].fields;
		const fields = fieldsFunction({});
		return fields.blockedUsers.resolve;
	};

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			const resolver = getResolver();
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				resolver(mockOrganization, {}, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Input Validation", () => {
		it("should throw invalid_arguments error if cursor is invalid", async () => {
			const resolver = getResolver();
			const args = { after: "invalid-cursor" };

			await expect(
				resolver(mockOrganization, args, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.arrayContaining(["after"]),
							}),
						]),
					},
				}),
			);
		});
	});

	describe("Cursor Validation", () => {
		it("should throw arguments_associated_resources_not_found if cursor points to non-existent data", async () => {
			const resolver = getResolver();
			const cursor = Buffer.from(
				JSON.stringify({
					createdAt: new Date().toISOString(),
					userId: "non-existent-user",
				}),
			).toString("base64url");
			const args = { after: cursor };

			mockContext.drizzleClient.query.blockedUsersTable.findMany.mockResolvedValue([]);

			await expect(
				resolver(mockOrganization, args, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["after"] }],
					},
				}),
			);
		});
	});

	describe("Query Execution", () => {
		type ConnectionResult = {
			edges: Array<{ node: any }>;
			pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean };
		};

		it("should return empty connection when no blocked users exist", async () => {
			const resolver = getResolver();
			mockContext.drizzleClient.query.blockedUsersTable.findMany.mockResolvedValue([]);

			const result = await resolver(mockOrganization, {}, mockContext) as ConnectionResult;
			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("should return connection with blocked users when they exist", async () => {
			const resolver = getResolver();
			const blockedUsers = [
				{
					createdAt: new Date("2024-02-07T10:30:00.000Z"),
					userId: "user-2",
					user: {
						id: "user-2",
						name: "Blocked User 1",
					},
				},
				{
					createdAt: new Date("2024-02-07T09:30:00.000Z"),
					userId: "user-3",
					user: {
						id: "user-3",
						name: "Blocked User 2",
					},
				},
			];
			mockContext.drizzleClient.query.blockedUsersTable.findMany.mockResolvedValue(blockedUsers);

			const result = await resolver(mockOrganization, { first: 10 }, mockContext) as ConnectionResult;
			expect(result.edges).toHaveLength(2);

			// @ts-ignore - We know these exist based on the previous assertion
			expect(result.edges[0].node).toEqual(blockedUsers[0].user);
			// @ts-ignore - We know these exist based on the previous assertion
			expect(result.edges[1].node).toEqual(blockedUsers[1].user);

			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("should handle pagination with 'first' argument", async () => {
			const resolver = getResolver();
			const blockedUsers = [
				{
					createdAt: new Date("2024-02-07T10:30:00.000Z"),
					userId: "user-2",
					user: {
						id: "user-2",
						name: "Blocked User 1",
					},
				},
			];
			mockContext.drizzleClient.query.blockedUsersTable.findMany.mockResolvedValue(blockedUsers);

			const result = await resolver(mockOrganization, { first: 1 }, mockContext) as ConnectionResult;
			expect(result.edges).toHaveLength(1);

			// @ts-ignore - We know this exists based on the previous assertion
			expect(result.edges[0].node).toEqual(blockedUsers[0].user);

			// Verify that the limit was passed to the query
			expect(mockContext.drizzleClient.query.blockedUsersTable.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 1,
				}),
			);
		});

		it("should handle pagination with 'after' cursor", async () => {
			const resolver = getResolver();
			const blockedUsers = [
				{
					createdAt: new Date("2024-02-07T09:30:00.000Z"),
					userId: "user-3",
					user: {
						id: "user-3",
						name: "Blocked User 2",
					},
				},
			];

			const cursor = Buffer.from(
				JSON.stringify({
					createdAt: new Date("2024-02-07T10:30:00.000Z").toISOString(),
					userId: "user-2",
				}),
			).toString("base64url");

			mockContext.drizzleClient.query.blockedUsersTable.findMany.mockResolvedValue(blockedUsers);

			const result = await resolver(mockOrganization, { first: 10, after: cursor }, mockContext) as ConnectionResult;
			expect(result.edges).toHaveLength(1);

			// @ts-ignore - We know this exists based on the previous assertion
			expect(result.edges[0].node).toEqual(blockedUsers[0].user);

			expect(mockContext.drizzleClient.query.blockedUsersTable.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.anything(),
				}),
			);
		});

		it("should handle reversed pagination with 'last' and 'before'", async () => {
			const resolver = getResolver();
			const blockedUsers = [
				{
					createdAt: new Date("2024-02-07T10:30:00.000Z"),
					userId: "user-2",
					user: {
						id: "user-2",
						name: "Blocked User 1",
					},
				},
			];

			const cursor = Buffer.from(
				JSON.stringify({
					createdAt: new Date("2024-02-07T09:30:00.000Z").toISOString(),
					userId: "user-3",
				}),
			).toString("base64url");

			mockContext.drizzleClient.query.blockedUsersTable.findMany.mockResolvedValue(blockedUsers);

			const result = await resolver(mockOrganization, { last: 10, before: cursor }, mockContext) as ConnectionResult;
			expect(result.edges).toHaveLength(1);

			// @ts-ignore - We know this exists based on the previous assertion
			expect(result.edges[0].node).toEqual(blockedUsers[0].user);

			expect(mockContext.drizzleClient.query.blockedUsersTable.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					orderBy: expect.anything(), 
				}),
			);
		});
	});
});