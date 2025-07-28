import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { eventCreatorResolver } from "~/src/graphql/types/Event/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Event Creator Resolver -Test ", () => {
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
		await expect(eventCreatorResolver(mockEvent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should return null for null creatorId", async () => {
		mockEvent.creatorId = null;
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({});
		const result = await eventCreatorResolver(mockEvent, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if they are the creator", async () => {
		mockEvent.creatorId = "user-123";
		const mockUserData = {
			id: "user-123",
			role: "administrator",
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		const result = await eventCreatorResolver(mockEvent, {}, ctx);
		expect(result).toEqual(
			expect.objectContaining({
				id: "user-123",
				role: "administrator",
			}),
		);
	});

	it("should fetch creator from database when different from current user", async () => {
		const mockCreator = {
			id: "creator-456",
			role: "member",
		};
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user-123", role: "member" })
			.mockResolvedValueOnce(mockCreator);
		const result = await eventCreatorResolver(mockEvent, {}, ctx);
		expect(result).toEqual(
			expect.objectContaining({
				id: "creator-456",
				role: "member",
			}),
		);
	});

	it("should throw unexpected error if existing user is not found ", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user-123", role: "member" })
			.mockResolvedValueOnce(undefined);
		await expect(eventCreatorResolver(mockEvent, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
	});

	describe("Database Query Errors", () => {
		it("should handle database connection error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
				new Error("ECONNREFUSED"),
			);
			await expect(eventCreatorResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});

		it("should handle database timeout error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
				new Error("Query timeout"),
			);
			await expect(eventCreatorResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});

		it("should handle database constraint violation", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
				new Error("violates foreign key constraint"),
			);
			await expect(eventCreatorResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});

		it("should handle database query syntax error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
				new Error("syntax error in SQL statement"),
			);
			await expect(eventCreatorResolver(mockEvent, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});
	});

	it("should pass through TalawaGraphQLError without wrapping", async () => {
		const originalError = new TalawaGraphQLError({
			message: "Custom error",
			extensions: { code: "unexpected" },
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
			originalError,
		);
		await expect(eventCreatorResolver(mockEvent, {}, ctx)).rejects.toThrow(
			originalError,
		);
		expect(ctx.log.error).not.toHaveBeenCalled();
	});
});
