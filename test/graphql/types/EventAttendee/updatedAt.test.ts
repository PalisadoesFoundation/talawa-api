import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeUpdatedAtResolver } from "~/src/graphql/types/EventAttendee/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type WhereCallback = (fields: unknown, operators: unknown) => unknown;

type FindFirstArgs = {
	where?: WhereCallback;
	with?: {
		organizationMembershipsWhereMember?: {
			where?: WhereCallback;
		};
	};
};

describe("EventAttendee UpdatedAt Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockEventAttendee: EventAttendeeType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let currentUserId: string;
	let organizationId: string;

	beforeEach(() => {
		currentUserId = faker.string.uuid();
		organizationId = faker.string.uuid();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			currentUserId,
		);
		ctx = context;
		mocks = newMocks;
		mockEventAttendee = {
			id: faker.string.uuid(),
			userId: faker.string.uuid(),
			eventId: faker.string.uuid(),
			recurringEventInstanceId: null,
			checkinTime: null,
			checkoutTime: null,
			feedbackSubmitted: false,
			isInvited: true,
			isRegistered: true,
			isCheckedIn: false,
			isCheckedOut: false,
			createdAt: faker.date.past(),
			updatedAt: faker.date.recent(),
		} as EventAttendeeType;
	});

	describe("Schema wiring", () => {
		it("should expose updatedAt on EventAttendee as a DateTime field", () => {
			const eventAttendeeType = schema.getType(
				"EventAttendee",
			) as GraphQLObjectType;
			const updatedAtField = eventAttendeeType.getFields().updatedAt;

			expect(updatedAtField).toBeDefined();
			expect(updatedAtField?.type.toString()).toBe("DateTime");
			expect(updatedAtField?.description).toBe(
				"Date time when the event attendee record was last updated.",
			);
			expect(updatedAtField?.resolve).toBeTypeOf("function");
		});
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unauthenticated error if current user doesn't exist", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId,
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
		it("should throw unauthorized_action for a regular user with no organization membership", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId,
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
				organizationMembershipsWhereMember: [],
			});

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should throw unauthorized_action for a regular user who is a regular organization member", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId,
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
				organizationMembershipsWhereMember: [{ role: "regular" }],
			});

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should return updatedAt for a system administrator without organization membership", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId,
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
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

		it("should return updatedAt for a regular user who is an organization administrator", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId,
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});

			const result = await eventAttendeeUpdatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toEqual(mockEventAttendee.updatedAt);
		});
	});

	describe("Organization Context Resolution", () => {
		it("should look up the organization from a standalone event", async () => {
			const eventEqMock = vi.fn();
			const userEqMock = vi.fn();
			const membershipEqMock = vi.fn();

			mocks.drizzleClient.query.eventsTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as FindFirstArgs;
					args.where?.({ id: "events.id" }, { eq: eventEqMock });
					return Promise.resolve({ organizationId });
				},
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as FindFirstArgs;
					args.where?.({ id: "users.id" }, { eq: userEqMock });
					args.with?.organizationMembershipsWhereMember?.where?.(
						{ organizationId: "memberships.organizationId" },
						{ eq: membershipEqMock },
					);
					return Promise.resolve({
						role: "regular",
						organizationMembershipsWhereMember: [{ role: "administrator" }],
					});
				},
			);

			const result = await eventAttendeeUpdatedAtResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual(mockEventAttendee.updatedAt);
			expect(eventEqMock).toHaveBeenCalledWith(
				"events.id",
				mockEventAttendee.eventId,
			);
			expect(userEqMock).toHaveBeenCalledWith("users.id", currentUserId);
			expect(membershipEqMock).toHaveBeenCalledWith(
				"memberships.organizationId",
				organizationId,
			);
			expect(
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should look up the organization from a recurring event instance", async () => {
			const recurringInstanceId = faker.string.uuid();
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: recurringInstanceId,
			} as EventAttendeeType;
			const instanceEqMock = vi.fn();
			const membershipEqMock = vi.fn();

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as FindFirstArgs;
					args.where?.(
						{ id: "recurringEventInstances.id" },
						{ eq: instanceEqMock },
					);
					return Promise.resolve({ organizationId });
				},
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as FindFirstArgs;
					args.with?.organizationMembershipsWhereMember?.where?.(
						{ organizationId: "memberships.organizationId" },
						{ eq: membershipEqMock },
					);
					return Promise.resolve({
						role: "regular",
						organizationMembershipsWhereMember: [{ role: "administrator" }],
					});
				},
			);

			const result = await eventAttendeeUpdatedAtResolver(
				recurringAttendee,
				{},
				ctx,
			);

			expect(result).toEqual(recurringAttendee.updatedAt);
			expect(instanceEqMock).toHaveBeenCalledWith(
				"recurringEventInstances.id",
				recurringInstanceId,
			);
			expect(membershipEqMock).toHaveBeenCalledWith(
				"memberships.organizationId",
				organizationId,
			);
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unexpected error when the standalone event is not found", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unexpected error when the recurring event instance is not found", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: faker.string.uuid(),
			} as EventAttendeeType;
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(recurringAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unexpected error when neither eventId nor recurringEventInstanceId is set", async () => {
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

	describe("Error Handling", () => {
		it("should rethrow TalawaGraphQLError without wrapping or logging", async () => {
			const originalError = new TalawaGraphQLError({
				message: "Custom validation error",
				extensions: { code: "unauthorized_action" },
			});
			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				originalError,
			);

			await expect(
				eventAttendeeUpdatedAtResolver(mockEventAttendee, {}, ctx),
			).rejects.toBe(originalError);
			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should wrap generic errors from the events query and log them", async () => {
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

		it("should wrap generic errors from the users query and log them", async () => {
			const timeoutError = new Error("ETIMEDOUT");
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				organizationId,
			});
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
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
});
