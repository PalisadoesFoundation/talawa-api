import { count, eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { describe, expect, it, vi } from "vitest";
import { eventsTable } from "~/src/drizzle/schema";
import { eventsCountResolver } from "~/src/graphql/types/Organization/eventsCount";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Parent organization mock
const mockParent = {
	id: "org123",
	name: "Test Organization",
	description: "Test Description",
	creatorId: "123e4567-e89b-12d3-a456-426614174000",
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
	userRegistrationRequired: false,
};

describe("Organization eventsCountResolver", () => {
	describe("eventsCountResolver", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context: mockContext } = createMockGraphQLContext();
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				eventsCountResolver(mockParent, {}, mockContext),
			).rejects.toThrowError(TalawaGraphQLError);

			await expect(
				eventsCountResolver(mockParent, {}, mockContext),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				eventsCountResolver(mockParent, {}, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should return events count for authenticated client", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			const mockQuery = Promise.resolve([{ total: 12 }]);
			const whereMock = vi.fn().mockReturnValue(mockQuery);
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });
			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await eventsCountResolver(mockParent, {}, mockContext);

			expect(result).toBe(12);
			expect(mockContext.drizzleClient.select).toHaveBeenCalledWith({
				total: count(),
			});
			expect(fromMock).toHaveBeenCalledWith(eventsTable);
			expect(whereMock).toHaveBeenCalledWith(
				eq(eventsTable.organizationId, "org123"),
			);
		});
	});
});
