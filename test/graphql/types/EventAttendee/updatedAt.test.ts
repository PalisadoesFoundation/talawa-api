import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeUpdatedAtResolver } from "~/src/graphql/types/EventAttendee/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("EventAttendee UpdatedAt Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockEventAttendee: EventAttendeeType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockEventAttendee = {
			id: "attendee-123",
			userId: "user-789",
			eventId: "event-456",
			recurringEventInstanceId: null,
			checkinTime: null,
			checkoutTime: null,
			feedbackSubmitted: false,
			isInvited: true,
			isRegistered: true,
			isCheckedIn: false,
			isCheckedOut: false,
			createdAt: new Date("2024-03-10T08:00:00Z"),
			updatedAt: new Date("2024-03-10T12:00:00Z"),
		} as EventAttendeeType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user doesn't exist", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId: "org-123",
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Authorization", () => {
		it("should throw unauthorized error if user is not a global admin and has no membership in the organization", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId: "org-123",
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [],
			});

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);

			// Call database where callback manually to cover Drizzle query arguments
			const userCall =
				mocks.drizzleClient.query.usersTable.findFirst.mock.calls[0][0];
			const mockOperators = { eq: vi.fn() };
			const mockFields = { organizationId: "org-123", id: "user-123" };
			userCall.where(mockFields, mockOperators);
			userCall.with.organizationMembershipsWhereMember.where(
				mockFields,
				mockOperators,
			);
		});

		it("should throw unauthorized error if user is not a global admin and organization membership is not administrator", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId: "org-123",
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: "org-123" },
				],
			});

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("should succeed and return updatedAt if user is a global administrator", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId: "org-123",
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});

			const result = await eventAttendeeUpdatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.updatedAt);
		});

		it("should succeed and return updatedAt if user is an organization administrator", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId: "org-123",
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: "org-123" },
				],
			});

			const result = await eventAttendeeUpdatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.updatedAt);
		});
	});

	describe("Error Handling with Try-Catch", () => {
		it("should pass through TalawaGraphQLError without wrapping", async () => {
			const originalError = new TalawaGraphQLError({
				message: "Custom validation error",
				extensions: { code: "unauthorized_action" },
			});

			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				originalError,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(originalError);

			// Should not double-log TalawaGraphQLErrors
			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should wrap generic errors with internal server error", async () => {
			const genericError = new Error("Database constraint violation");

			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				genericError,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message:
						"Unexpected error while resolving EventAttendee.updatedAt field",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(genericError);
		});

		it("should handle network timeout errors", async () => {
			const timeoutError = new Error("ETIMEDOUT");

			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				timeoutError,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message:
						"Unexpected error while resolving EventAttendee.updatedAt field",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(timeoutError);
		});
	});

	describe("Organization Context Resolution", () => {
		it("should handle standalone event organization lookup", async () => {
			const mockEvent = { organizationId: "org-123" };
			const mockAdmin: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdmin,
			);

			const result = await eventAttendeeUpdatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.updatedAt);

			// Call where callback manually to cover Drizzle query arguments
			const eventCall =
				mocks.drizzleClient.query.eventsTable.findFirst.mock.calls[0][0];
			const mockOperators = { eq: vi.fn() };
			const mockFields = { id: "event-456" };
			eventCall.where(mockFields, mockOperators);
		});

		it("should handle recurring instance organization lookup", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			const mockInstance = { organizationId: "org-123" };
			const mockAdmin: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: "org-123" },
				],
			};

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockInstance,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdmin,
			);

			const result = await eventAttendeeUpdatedAtResolver(
				recurringAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(recurringAttendee.updatedAt);

			// Call where callback manually to cover Drizzle query arguments
			const instanceCall =
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mock
					.calls[0][0];
			const mockOperators = { eq: vi.fn() };
			const mockFields = { id: "instance-789" };
			instanceCall.where(mockFields, mockOperators);
		});

		it("should throw unexpected error for missing event context", async () => {
			const invalidAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: null,
			} as EventAttendeeType;

			await expect(
				eventAttendeeUpdatedAtResolver(invalidAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should throw unexpected error if standalone event is not found", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should throw unexpected error if recurring event instance is not found", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(recurringAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});
	});
});
