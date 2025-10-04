import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { eventCreatedAtResolver } from "~/src/graphql/types/Event/createdAt";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
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

describe("Event CreatedAt Resolver Tests", () => {
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

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(eventCreatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);
		await expect(eventCreatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthorized_action error if user is not an administrator", async () => {
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
		await expect(eventCreatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return createdAt if user is system administrator", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		const result = await eventCreatedAtResolver(mockEvent, {}, ctx);
		expect(result).toBe(mockEvent.createdAt);
	});

	it("should return createdAt if user is organization administrator", async () => {
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
		const result = await eventCreatedAtResolver(mockEvent, {}, ctx);
		expect(result).toBe(mockEvent.createdAt);
	});

	it("should handle database query failures", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("Database error"),
		);
		await expect(eventCreatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
			new Error("Database error"),
		);
	});

	it("should query the database with the correct organizationId filter", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: mockEvent.organizationId },
			],
		};

		// Mock implementation to verify if organizationId filter is used
		(
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ with: withClause }) => {
			expect(withClause).toBeDefined();

			const mockFields = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			};
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			// Verify the inner where clause inside withClause
			const innerWhereResult =
				withClause.organizationMembershipsWhereMember.where(
					mockFields,
					mockOperators,
				);
			expect(innerWhereResult).toEqual(
				expect.objectContaining({
					[mockFields.organizationId]: mockEvent.organizationId, // Ensure organizationId filter is applied
				}),
			);
			return Promise.resolve(mockUserData);
		});

		const result = await eventCreatedAtResolver(mockEvent, {}, ctx);
		expect(result).toEqual(mockEvent.createdAt);
	});
});
