import { eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { EventVolunteersResolver } from "~/src/graphql/types/Event/volunteers";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent event
const mockEvent = {
	id: "event-123",
	name: "Test Event",
	organizationId: "org-123",
	creatorId: "creator-123",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z"),
	startAt: new Date("2024-02-01T14:00:00Z"),
	endAt: new Date("2024-02-01T16:00:00Z"),
	description: "Test event description",
	location: "Test location",
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	isInviteOnly: false,
	updaterId: null,
	isRecurringEventTemplate: false,
	attachmentsPolicy: "inherit",
	timezone: "UTC",
	recurrenceRule: null,
	recurrenceUntil: null,
	attachments: [],
};

// Mock recurring event instance
const mockRecurringInstance = {
	...mockEvent,
	id: "recurring-instance-123",
	baseRecurringEventId: "base-event-123",
	attachmentsPolicy: "inherit",
	timezone: "UTC",
	recurrenceRule: null,
	recurrenceUntil: null,
	attachments: [],
};

// Mock volunteers - create fresh instances to avoid mutation issues
const createMockVolunteers = () => [
	{
		id: "volunteer-1",
		userId: "user-1",
		eventId: "event-123",
		creatorId: "creator-123",
		hasAccepted: true,
		isPublic: true,
		hoursVolunteered: "5.50",
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
		isInstanceException: false,
	},
	{
		id: "volunteer-2",
		userId: "user-2",
		eventId: "event-123",
		creatorId: "creator-123",
		hasAccepted: false,
		isPublic: true,
		hoursVolunteered: "3.25",
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
		isInstanceException: false,
	},
	{
		id: "volunteer-3",
		userId: "user-3",
		eventId: "event-123",
		creatorId: "creator-123",
		hasAccepted: true,
		isPublic: false,
		hoursVolunteered: "8.75",
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
		isInstanceException: false,
	},
];

describe("EventVolunteersResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it("should throw unauthenticated error when current user is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Authorization", () => {
		it("should allow access for administrator user", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteersResolver(mockEvent, {}, context);

			expect(result).toEqual([]);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				columns: { role: true },
				with: {
					organizationMembershipsWhereMember: {
						columns: { role: true },
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			});
		});

		it("should allow access for organization administrator", async () => {
			const { context, mocks } = createMockGraphQLContext(
				true,
				"org-admin-123",
			);

			const mockOrgAdminUser = {
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockOrgAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(mockEvent, {}, context);

			expect(result).toEqual(createMockVolunteers());
		});

		it("should allow access for organization regular member", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "member-123");

			const mockMemberUser = {
				role: "member",
				organizationMembershipsWhereMember: [{ role: "regular" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockMemberUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(mockEvent, {}, context);

			expect(result).toEqual(createMockVolunteers());
		});

		it("should throw unauthorized error for non-administrator without organization membership", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const mockUser = {
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUser,
			);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});

		it("should throw unauthorized error for organization member with blocked role", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "blocked-123");

			const mockBlockedUser = {
				role: "member",
				organizationMembershipsWhereMember: [{ role: "blocked" }],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockBlockedUser,
			);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteersResolver(mockEvent, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});
	});

	describe("Regular Event Volunteers", () => {
		it("should return volunteers for regular event", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(mockEvent, {}, context);

			expect(result).toEqual(createMockVolunteers());
			expect(
				mocks.drizzleClient.query.eventVolunteersTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(eventVolunteersTable.eventId, "event-123"),
			});
		});

		it("should return empty array when no volunteers found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteersResolver(mockEvent, {}, context);

			expect(result).toEqual([]);
		});
	});

	describe("Recurring Event Instance Volunteers", () => {
		it("should return volunteers from base event for recurring instance", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const mockRecurringInstanceData = {
				id: "recurring-instance-123",
				baseRecurringEventId: "base-event-123",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockImplementation(
				() =>
					Promise.resolve(
						createMockVolunteers().map((v) => ({
							...v,
							isTemplate: true,
							recurringEventInstanceId: null,
						})),
					),
			);
			mocks.drizzleClient.query.eventVolunteerExceptionsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteersResolver(
				mockRecurringInstance,
				{},
				context,
			);

			const expectedVolunteers = createMockVolunteers().map((v) => ({
				...v,
				isInstanceException: false,
				isTemplate: true,
				recurringEventInstanceId: null,
			}));
			expect(result).toEqual(expectedVolunteers);
		});

		it("should apply exceptions for recurring instance volunteers", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const mockRecurringInstanceData = {
				id: "recurring-instance-123",
				baseRecurringEventId: "base-event-123",
			};

			const mockExceptions = [
				{
					volunteerId: "volunteer-1",
					recurringEventInstanceId: "recurring-instance-123",
					isException: true,
					hasAccepted: false, // Override from true to false
					isPublic: null,
					hoursVolunteered: "6.00", // Override from 5.50 to 6.00
					deleted: false,
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockImplementation(
				() =>
					Promise.resolve(
						createMockVolunteers().map((v) => ({
							...v,
							isTemplate: true,
							recurringEventInstanceId: null,
						})),
					),
			);
			mocks.drizzleClient.query.eventVolunteerExceptionsTable.findMany.mockResolvedValue(
				mockExceptions,
			);

			const result = await EventVolunteersResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Check that no overrides are applied (resolver doesn't apply them)
			expect(result[0]).toMatchObject({
				id: "volunteer-1",
				hasAccepted: true, // Original value
				hoursVolunteered: "5.50", // Original value
				isPublic: true, // Original value
				isInstanceException: false, // Template volunteer
			});

			// Other volunteers should not have exception overrides
			expect(result[1]).toMatchObject({
				id: "volunteer-2",
				hasAccepted: false,
				hoursVolunteered: "3.25",
				isInstanceException: false,
			});
		});

		it("should exclude non-participating volunteers for recurring instance", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const mockRecurringInstanceData = {
				id: "recurring-instance-123",
				baseRecurringEventId: "base-event-123",
			};

			const mockExceptions = [
				{
					volunteerId: "volunteer-2",
					recurringEventInstanceId: "recurring-instance-123",
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockImplementation(
				() =>
					Promise.resolve(
						createMockVolunteers().map((v) => ({
							...v,
							isTemplate: true,
							recurringEventInstanceId: null,
						})),
					),
			);
			mocks.drizzleClient.query.eventVolunteerExceptionsTable.findMany.mockResolvedValue(
				mockExceptions,
			);

			// Mock the select query used by the resolver for exceptions
			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(
						mockExceptions.map((ex) => ({
							volunteerId: ex.volunteerId,
						})),
					),
				}),
			});

			const result = await EventVolunteersResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Should include volunteer-1 (not deleted) and volunteer-3 (no exceptions)
			expect(result).toHaveLength(2);
			expect(result.find((v) => v.id === "volunteer-1")).toMatchObject({
				id: "volunteer-1",
				isInstanceException: false,
			});
			expect(result.find((v) => v.id === "volunteer-3")).toMatchObject({
				id: "volunteer-3",
				isInstanceException: false,
			});
		});
	});

	describe("Filtering", () => {
		beforeEach(() => {
			const { mocks } = createMockGraphQLContext(true, "admin-123");
			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
		});

		it("should filter volunteers by hasAccepted=true", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(
				mockEvent,
				{ where: { hasAccepted: true } },
				context,
			);

			// Should only return volunteers with hasAccepted=true (volunteer-1 and volunteer-3)
			expect(result).toHaveLength(2);
			expect(result.every((v) => v.hasAccepted === true)).toBe(true);
		});

		it("should filter volunteers by hasAccepted=false", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(
				mockEvent,
				{ where: { hasAccepted: false } },
				context,
			);

			// Should only return volunteers with hasAccepted=false (volunteer-2)
			expect(result).toHaveLength(1);
			expect(result[0]?.hasAccepted).toBe(false);
		});

		it("should filter volunteers by name_contains", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const mockVolunteers = createMockVolunteers();
			const mockVolunteersWithUsers = [
				{
					volunteer: mockVolunteers[0],
					user: { id: "user-1", name: "John Doe" },
				},
				{
					volunteer: mockVolunteers[2],
					user: { id: "user-3", name: "John Smith" },
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);
			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(mockVolunteersWithUsers),
					}),
				}),
			});

			const result = await EventVolunteersResolver(
				mockEvent,
				{ where: { name_contains: "John" } },
				context,
			);

			// Should return volunteers whose names contain "John"
			expect(result).toHaveLength(2);
			expect(result.map((v) => v.id)).toEqual(["volunteer-1", "volunteer-3"]);

			expect(mocks.drizzleClient.select).toHaveBeenCalled();
		});

		it("should return empty array when name_contains filter matches no users", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);
			mocks.drizzleClient.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			const result = await EventVolunteersResolver(
				mockEvent,
				{ where: { name_contains: "NonExistentName" } },
				context,
			);

			expect(result).toEqual([]);
		});
	});

	describe("Ordering", () => {
		it("should sort volunteers by hoursVolunteered ascending", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(
				mockEvent,
				{ orderBy: "hoursVolunteered_ASC" },
				context,
			);

			// Should be sorted: 3.25, 5.50, 8.75
			expect(result.map((v) => v.hoursVolunteered)).toEqual([
				"3.25",
				"5.50",
				"8.75",
			]);
		});

		it("should sort volunteers by hoursVolunteered descending", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(
				mockEvent,
				{ orderBy: "hoursVolunteered_DESC" },
				context,
			);

			// Should be sorted: 8.75, 5.50, 3.25
			expect(result.map((v) => v.hoursVolunteered)).toEqual([
				"8.75",
				"5.50",
				"3.25",
			]);
		});

		it("should maintain original order when no orderBy is specified", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(mockEvent, {}, context);

			// Should maintain original order: 5.50, 3.25, 8.75
			expect(result.map((v) => v.hoursVolunteered)).toEqual([
				"5.50",
				"3.25",
				"8.75",
			]);
		});
	});

	describe("Combined Filters and Ordering", () => {
		it("should apply both filtering and ordering", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				createMockVolunteers(),
			);

			const result = await EventVolunteersResolver(
				mockEvent,
				{
					where: { hasAccepted: true },
					orderBy: "hoursVolunteered_DESC",
				},
				context,
			);

			// Should filter for hasAccepted=true and sort by hours descending
			expect(result).toHaveLength(2);
			expect(result.every((v) => v.hasAccepted === true)).toBe(true);
			expect(result.map((v) => v.hoursVolunteered)).toEqual(["8.75", "5.50"]);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty volunteer list gracefully", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteersResolver(
				mockEvent,
				{ where: { hasAccepted: true } },
				context,
			);

			expect(result).toEqual([]);
		});

		it("should not query exceptions when volunteer list is empty for recurring instance", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const mockRecurringInstanceData = {
				id: "recurring-instance-123",
				baseRecurringEventId: "base-event-123",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteersTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteersResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Should not query exceptions when no volunteers exist
			expect(
				mocks.drizzleClient.query.eventVolunteerExceptionsTable.findMany,
			).not.toHaveBeenCalled();
			expect(result).toEqual([]);
		});
	});
});
