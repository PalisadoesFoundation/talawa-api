import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { eventAttendeeCreatedAtResolver } from "~/src/graphql/types/EventAttendee/createdAt";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("EventAttendee CreatedAt Resolver Tests", () => {
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
			updatedAt: new Date("2024-03-10T08:00:00Z"),
		} as EventAttendeeType;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventAttendeeCreatedAtResolver(mockEventAttendee, {}, ctx),
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
				eventAttendeeCreatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Organization Resolution - Standalone Event", () => {
		it("should throw unexpected error if standalone event is not found", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeCreatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should successfully resolve organization from standalone event", async () => {
			const mockEvent = {
				organizationId: "org-123",
			};

			const mockUser: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await eventAttendeeCreatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.createdAt);
		});
	});

	describe("Organization Resolution - Recurring Event Instance", () => {
		it("should throw unexpected error if recurring instance is not found", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeCreatedAtResolver(recurringAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should successfully resolve organization from recurring instance", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			const mockInstance = {
				organizationId: "org-123",
			};

			const mockUser: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockInstance,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			const result = await eventAttendeeCreatedAtResolver(
				recurringAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(recurringAttendee.createdAt);
		});
	});

	describe("Authorization", () => {
		it("should allow access for system administrator", async () => {
			const mockEvent = { organizationId: "org-123" };
			const mockAdminUser: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);

			const result = await eventAttendeeCreatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.createdAt);
		});

		it("should allow access for organization administrator", async () => {
			const mockEvent = { organizationId: "org-123" };
			const mockOrgAdmin: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: "org-123" },
				],
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockOrgAdmin,
			);

			const result = await eventAttendeeCreatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.createdAt);
		});

		it("should throw unauthorized_action for regular user without admin rights", async () => {
			const mockEvent = { organizationId: "org-123" };
			const mockRegularUser: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "regular", organizationId: "org-123" },
				],
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockRegularUser,
			);

			await expect(
				eventAttendeeCreatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("should throw unauthorized_action for user without organization membership", async () => {
			const mockEvent = { organizationId: "org-123" };
			const mockUserWithoutMembership: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserWithoutMembership,
			);

			await expect(
				eventAttendeeCreatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should throw unexpected error when neither eventId nor instanceId exists", async () => {
			const invalidAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: null,
			} as EventAttendeeType;

			await expect(
				eventAttendeeCreatedAtResolver(invalidAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should handle database connection failures gracefully", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				new Error("Connection pool exhausted"),
			);

			await expect(
				eventAttendeeCreatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Connection pool exhausted");
		});

		it("should handle different organization contexts", async () => {
			const organizationIds = ["org-123", "org-456", "org-789"];

			for (const orgId of organizationIds) {
				const mockEvent = { organizationId: orgId };
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

				const result = await eventAttendeeCreatedAtResolver(
					mockEventAttendee,
					{},
					ctx,
				);
				expect(result).toEqual(mockEventAttendee.createdAt);
			}
		});
	});
});
