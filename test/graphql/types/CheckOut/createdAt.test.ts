import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { CheckOut as CheckOutType } from "~/src/graphql/types/CheckOut/CheckOut";
import { checkOutCreatedAtResolver } from "~/src/graphql/types/CheckOut/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("CheckOut CreatedAt Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockCheckOut: CheckOutType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockCheckOut = {
			id: "checkout-123",
			eventAttendeeId: "attendee-456",
			time: new Date("2024-03-10T18:00:00Z"),
			createdAt: new Date("2024-03-10T18:00:00Z"),
		} as CheckOutType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user doesn't exist", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId: "org-123",
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Event Attendee Resolution", () => {
		it("should throw unexpected error if event attendee is not found", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});
	});

	describe("Organization Resolution - Standalone Event", () => {
		it("should throw unexpected error if standalone event is not found", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should successfully resolve organization from standalone event", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const mockEvent = {
				organizationId: "org-123",
			};

			const mockUser: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await checkOutCreatedAtResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(mockCheckOut.createdAt);
		});
	});

	describe("Organization Resolution - Recurring Event Instance", () => {
		it("should throw unexpected error if recurring instance is not found", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: null,
				recurringEventInstanceId: "instance-789",
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should successfully resolve organization from recurring instance", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: null,
				recurringEventInstanceId: "instance-789",
			};

			const mockInstance = {
				organizationId: "org-123",
			};

			const mockUser: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockInstance,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await checkOutCreatedAtResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(mockCheckOut.createdAt);
		});
	});

	describe("Authorization", () => {
		it("should allow access for system administrator", async () => {
			const mockEventAttendee = {
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const mockEvent = { organizationId: "org-123" };

			const mockAdminUser: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);

			const result = await checkOutCreatedAtResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(mockCheckOut.createdAt);
		});

		it("should allow access for organization administrator", async () => {
			const mockEventAttendee = {
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const mockEvent = { organizationId: "org-123" };

			const mockOrgAdminUser: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: "org-123" },
				],
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockOrgAdminUser,
			);

			const result = await checkOutCreatedAtResolver(mockCheckOut, {}, ctx);
			expect(result).toEqual(mockCheckOut.createdAt);
		});

		it("should throw unauthorized_action for regular user with no admin rights", async () => {
			const mockEventAttendee = {
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const mockEvent = { organizationId: "org-123" };

			const mockRegularUser: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "regular", organizationId: "org-123" },
				],
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockRegularUser,
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("should throw unauthorized_action for user with no organization membership", async () => {
			const mockEventAttendee = {
				eventId: "event-123",
				recurringEventInstanceId: null,
			};

			const mockEvent = { organizationId: "org-123" };

			const mockUserWithoutMembership: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserWithoutMembership,
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should throw unexpected error when neither eventId nor instanceId exists", async () => {
			const mockEventAttendee = {
				id: "attendee-456",
				userId: "user-789",
				eventId: null,
				recurringEventInstanceId: null,
			};

			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockResolvedValue(
				mockEventAttendee,
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should handle database errors gracefully", async () => {
			mocks.drizzleClient.query.eventAttendeesTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				checkOutCreatedAtResolver(mockCheckOut, {}, ctx),
			).rejects.toThrow("Database connection failed");
		});
	});
});
