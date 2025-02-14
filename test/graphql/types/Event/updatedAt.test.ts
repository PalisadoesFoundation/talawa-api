import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "vitest";
import type { CurrentClient, GraphQLContext } from "~/src/graphql/context";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { eventUpdatedAtResolver } from "~/src/graphql/types/Event/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

import "~/src/graphql/types/Event/Event";

const createMockContext = () => {
	const mockContext = {
		currentClient: {
			isAuthenticated: true,
			user: { id: "user-123", isAdmin: true },
		} as CurrentClient,
		drizzleClient: { query: { usersTable: { findFirst: vi.fn() } } },
		envConfig: { API_BASE_URL: "mock url" },
		jwt: { sign: vi.fn() },
		log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		minio: { presignedUrl: vi.fn(), putObject: vi.fn(), getObject: vi.fn() },
	};
	return mockContext as unknown as GraphQLContext;
};

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("Event Updated At Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockEvent: EventType;

	beforeEach(() => {
		vi.clearAllMocks();
		ctx = createMockContext();
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
			await expect(
				eventUpdatedAtResolver(mockEvent, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
			expect(
				ctx.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unauthenticated error if user exists but current user doesn't exist", async () => {
			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(undefined);

			await expect(
				eventUpdatedAtResolver(mockEvent, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
			expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		});

		it("should throw unauthorized_action for non-admin user with no organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockUserData);

			await expect(
				eventUpdatedAtResolver(mockEvent, {}, ctx),
			).rejects.toThrowError(TalawaGraphQLError);
		});

		it("should throw unauthorized_action for non-admin user with regular membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockEvent.organizationId },
				],
			};

			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockUserData);

			await expect(
				eventUpdatedAtResolver(mockEvent, {}, ctx),
			).rejects.toThrowError(
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

			// Mocking the query result
			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockUserData);

			const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);

			// Expect the function to return the correct updatedAt value
			expect(result).toBe(mockEvent.updatedAt);

			// ✅ Assert that the query was called with the correct parameters
			expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.any(Function), // Ensure `where` is a function
					columns: { role: true }, // Ensure correct columns are queried
					with: {
						organizationMembershipsWhereMember: expect.objectContaining({
							columns: { role: true }, // Ensure nested columns are correct
							where: expect.any(Function), // Ensure `where` is a function inside relationships
						}),
					},
				}),
			);
		});

		it.each([
			{ membershipRole: "administrator", description: "admin org membership" },
			{ membershipRole: "member", description: "regular org membership" },
		])(
			"should return updatedAt if user is system administrator with $description",
			async ({ membershipRole }) => {
				const mockUserData: MockUser = {
					id: "user-123",
					role: "administrator",
					organizationMembershipsWhereMember: [
						{ role: membershipRole, organizationId: mockEvent.organizationId },
					],
				};

				(
					ctx.drizzleClient.query.usersTable.findFirst as ReturnType<
						typeof vi.fn
					>
				).mockResolvedValue(mockUserData);

				const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);
				expect(result).toBe(mockEvent.updatedAt);
			},
		);

		it("should return updatedAt if user is organization administrator", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockEvent.organizationId },
				],
			};

			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockUserData);

			const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);
			expect(result).toBe(mockEvent.updatedAt);
		});
	});

	describe("Error Handling and Edge Cases", () => {
		it("should handle database query failures", async () => {
			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockRejectedValue(new Error("Database error"));

			await expect(eventUpdatedAtResolver(mockEvent, {}, ctx)).rejects.toThrow(
				"Unexpected error while resolving Event.updatedAt field",
			);
		});

		it("should handle unexpected role values", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "invalid_role",
				organizationMembershipsWhereMember: [],
			};

			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockUserData);

			await expect(
				eventUpdatedAtResolver(mockEvent, {}, ctx),
			).rejects.toThrowError(
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

			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockUserData);

			const result = await eventUpdatedAtResolver(mockEvent, {}, ctx);
			expect(result).toBe(null);
		});

		it("should handle invalid organizationId", async () => {
			/** Intentionally cast to null to test error handling for invalid organizationId */
			mockEvent.organizationId = null as unknown as string;
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			(
				ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValue(mockUserData);

			vi.spyOn(
				ctx.drizzleClient.query.usersTable,
				"findFirst",
			).mockImplementation(() => {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				});
			});

			await expect(
				eventUpdatedAtResolver(mockEvent, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});
	});
});
