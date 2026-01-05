import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { eventUpdatedAtResolver } from "~/src/graphql/types/Event/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

import "~/src/graphql/types/Event/Event";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("Event UpdatedAt Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockEvent: EventType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockEvent = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Annual General Meeting",
			description: "Discussion on yearly progress and future goals.",
			createdAt: new Date("2024-02-01T10:00:00Z"),
			updatedAt: new Date("2024-02-05T12:00:00Z"),
			startAt: new Date("2024-03-10T09:00:00Z"),
			endAt: new Date("2024-03-10T12:00:00Z"),
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			updaterId: "223e4567-e89b-12d3-a456-426614174001",
			organizationId: "789e1234-e89b-12d3-a456-426614174002",
		} as EventType;
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if userId exists but current user doesn't exists", async () => {
			const currentUser = undefined;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);

			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthorized_action for non-admin user with no organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("should throw unauthorized_action for non-admin user with regular membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockEvent.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});
	});

	describe("Successful Access Cases", () => {
		it("should return updatedAt if user is system administrator", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);

			expect(result).toBe(mockEvent.updatedAt);
		});

		it.each([
			{ membershipRole: "administrator", description: "admin org membership" },
			{ membershipRole: "member", description: "regular org membership" },
		])("should return updatedAt if user is system administrator with $description", async ({
			membershipRole,
		}) => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [
					{ role: membershipRole, organizationId: mockEvent.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);
			expect(result).toBe(mockEvent.updatedAt);
		});

		it("should return updatedAt if user is organization administrator", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockEvent.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);
			expect(result).toBe(mockEvent.updatedAt);
		});
	});

	describe("Error Handling and Edge Cases", () => {
		it("should handle database query failures", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database error"),
			);

			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Unexpected error while resolving Event.updatedAt field",
					extensions: { code: "unexpected" },
				}),
			);
		});

		it("should handle unexpected role values", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "invalid_role",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("should handle null updatedAt value", async () => {
			mockEvent.updatedAt = null;
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);
			expect(result).toBe(null);
		});

		it("should handle invalid organizationId", async () => {
			mockEvent.organizationId = null as unknown as string;

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(() => {
				throw new TalawaGraphQLError({
					message: "Unauthorized action",
					extensions: { code: "unauthorized_action" },
				});
			});

			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				expect.objectContaining({
					message: "Unauthorized action",
					extensions: { code: "unauthorized_action" },
				}),
			);
		});
	});
});
