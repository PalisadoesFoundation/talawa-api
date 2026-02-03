import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeUpdatedAtResolver } from "~/src/graphql/types/EventAttendee/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

vi.mock("~/src/graphql/types/EventAttendee/EventAttendee", () => {
	return {
		EventAttendee: {
			implement: vi.fn().mockImplementation((config) => {
				if (typeof config.fields === "function") {
					const mockT = {
						field: vi.fn(),
					};
					config.fields(mockT);
				}
			}),
		},
	};
});

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

		// Default mock implementation to execute callbacks and cover lines
		const findFirstReturnValues: Record<string, any> = {
			eventsTable: undefined,
			recurringEventInstancesTable: undefined,
			usersTable: undefined,
		};

		const createMockImplementation = (tableName: string) => {
			return async (options: any) => {
				const mockFields = { id: "id", organizationId: "organizationId" };
				const mockOperators = { eq: vi.fn() };

				if (options?.where) {
					options.where(mockFields, mockOperators);
				}
				if (options?.with?.organizationMembershipsWhereMember?.where) {
					options.with.organizationMembershipsWhereMember.where(
						mockFields,
						mockOperators,
					);
				}
				return findFirstReturnValues[tableName];
			};
		};

		(mocks.drizzleClient.query.eventsTable.findFirst as any).mockImplementation(
			createMockImplementation("eventsTable"),
		);
		(mocks.drizzleClient.query.recurringEventInstancesTable.findFirst as any).mockImplementation(
			createMockImplementation("recurringEventInstancesTable"),
		);
		(mocks.drizzleClient.query.usersTable.findFirst as any).mockImplementation(
			createMockImplementation("usersTable"),
		);

		// Helper to set return values
		(mocks as any).setTableReturnValue = (tableName: string, val: any) => {
			findFirstReturnValues[tableName] = val;
		};

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
			(mocks as any).setTableReturnValue("eventsTable", {
				organizationId: "org-123",
			});
			(mocks as any).setTableReturnValue("usersTable", undefined);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Error Handling", () => {
		it("should pass through TalawaGraphQLError without wrapping", async () => {
			const originalError = new TalawaGraphQLError({
				message: "Custom validation error",
				extensions: { code: "unauthorized_action" },
			});

			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValueOnce(
				originalError,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(originalError);

			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should wrap generic errors with internal server error", async () => {
			const genericError = new Error("Database constraint violation");

			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValueOnce(
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
	});

	describe("Organization Context Resolution", () => {
		it("should handle standalone event organization lookup", async () => {
			const mockEvent = { organizationId: "org-123" };
			const mockAdmin: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			(mocks as any).setTableReturnValue("eventsTable", mockEvent);
			(mocks as any).setTableReturnValue("usersTable", mockAdmin);

			const result = await eventAttendeeUpdatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.updatedAt);
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

			(mocks as any).setTableReturnValue("recurringEventInstancesTable", mockInstance);
			(mocks as any).setTableReturnValue("usersTable", mockAdmin);

			const result = await eventAttendeeUpdatedAtResolver(
				recurringAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(recurringAttendee.updatedAt);
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
	});

	describe("Authorization", () => {
		it("should throw unexpected error if event is not found", async () => {
			(mocks as any).setTableReturnValue("eventsTable", undefined);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should throw unexpected error if recurring instance is not found", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			(mocks as any).setTableReturnValue("recurringEventInstancesTable", undefined);

			await expect(
				eventAttendeeUpdatedAtResolver(recurringAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});

		it("should throw unauthorized_action error if user is not an admin", async () => {
			(mocks as any).setTableReturnValue("eventsTable", {
				organizationId: "org-123",
			});

			const regularUser: MockUser = {
				id: "user-123",
				role: "regular",
				organizationMembershipsWhereMember: [
					{ role: "regular", organizationId: "org-123" },
				],
			};

			(mocks as any).setTableReturnValue("usersTable", regularUser);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("should succeed if user is global administrator even without org membership", async () => {
			(mocks as any).setTableReturnValue("eventsTable", {
				organizationId: "org-123",
			});

			const globalAdmin: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			(mocks as any).setTableReturnValue("usersTable", globalAdmin);

			const result = await eventAttendeeUpdatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.updatedAt);
		});
	});
});
