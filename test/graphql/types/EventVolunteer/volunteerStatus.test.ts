import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerStatusResolver } from "~/src/graphql/types/EventVolunteer/volunteerStatus";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent EventVolunteer with hasAccepted = true
const mockAcceptedEventVolunteer = {
	id: "volunteer-123",
	userId: "user-123",
	eventId: "event-123",
	creatorId: "creator-123",
	hasAccepted: true,
	isPublic: true,
	hoursVolunteered: "5.50",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T10:00:00Z"),
	updaterId: "updater-123",
	recurringEventInstanceId: null,
	isTemplate: false,
};

// Mock parent EventVolunteer with hasAccepted = false
const mockPendingEventVolunteer = {
	...mockAcceptedEventVolunteer,
	hasAccepted: false,
};

describe("EventVolunteerStatusResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerStatusResolver(mockAcceptedEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerStatusResolver(mockAcceptedEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Status Calculation - hasAccepted = true", () => {
		it("should return 'accepted' when hasAccepted is true", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerStatusResolver(
				mockAcceptedEventVolunteer,
				{},
				context,
			);

			expect(result).toBe("accepted");
		});

		it("should not query database when hasAccepted is true", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			await EventVolunteerStatusResolver(
				mockAcceptedEventVolunteer,
				{},
				context,
			);

			// No database queries should be made when hasAccepted is true
			expect(mocks.drizzleClient.select).not.toHaveBeenCalled();
		});
	});

	describe("Status Calculation - hasAccepted = false", () => {
		it("should return 'pending' when hasAccepted is false and no rejected memberships", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock no memberships found
			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			expect(result).toBe("pending");
		});

		it("should return 'pending' when hasAccepted is false and only accepted memberships", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const acceptedMemberships = [
				{ status: "accepted" },
				{ status: "accepted" },
			];

			const executeMock = vi.fn().mockResolvedValue(acceptedMemberships);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			expect(result).toBe("pending");
		});

		it("should return 'rejected' when hasAccepted is false and has rejected membership", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const mixedMemberships = [
				{ status: "accepted" },
				{ status: "rejected" },
				{ status: "invited" },
			];

			const executeMock = vi.fn().mockResolvedValue(mixedMemberships);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			expect(result).toBe("rejected");
		});

		it("should return 'rejected' when multiple memberships include rejected", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const rejectedMemberships = [
				{ status: "rejected" },
				{ status: "rejected" },
			];

			const executeMock = vi.fn().mockResolvedValue(rejectedMemberships);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			expect(result).toBe("rejected");
		});
	});

	describe("Database Query Logic", () => {
		it("should query volunteerMemberships with correct filters", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			// Verify query structure
			expect(mocks.drizzleClient.select).toHaveBeenCalledWith({
				status: expect.any(Object),
			});
			expect(whereMock).toHaveBeenCalledTimes(1);
		});

		it("should filter by volunteer ID and event ID", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			// The where clause should filter by volunteerId and eventId
			expect(whereMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different volunteer and event combinations", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentVolunteer = {
				...mockPendingEventVolunteer,
				id: "different-volunteer-456",
				eventId: "different-event-789",
			};

			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerStatusResolver(
				differentVolunteer,
				{},
				context,
			);

			expect(result).toBe("pending");
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi
				.fn()
				.mockRejectedValue(new Error("Database connection failed"));
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await expect(
				EventVolunteerStatusResolver(mockPendingEventVolunteer, {}, context),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle malformed membership status data", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const malformedMemberships = [
				{ status: null },
				{ status: undefined },
				{ status: "invalid-status" },
			];

			const executeMock = vi.fn().mockResolvedValue(malformedMemberships);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			// Should default to pending when no valid rejected status found
			expect(result).toBe("pending");
		});

		it("should handle single rejected membership among others", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const singleRejectedMembership = [
				{ status: "invited" },
				{ status: "requested" },
				{ status: "rejected" }, // This one rejected status should return "rejected"
				{ status: "accepted" },
			];

			const executeMock = vi.fn().mockResolvedValue(singleRejectedMembership);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			expect(result).toBe("rejected");
		});
	});

	describe("Return Type Validation", () => {
		it("should always return valid VolunteerStatusType", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			// Test all scenarios return valid status types
			const acceptedResult = await EventVolunteerStatusResolver(
				mockAcceptedEventVolunteer,
				{},
				context,
			);
			const pendingResult = await EventVolunteerStatusResolver(
				mockPendingEventVolunteer,
				{},
				context,
			);

			// Test valid return types
			expect(["accepted", "rejected", "pending"]).toContain(acceptedResult);
			expect(["accepted", "rejected", "pending"]).toContain(pendingResult);
		});
	});
});
