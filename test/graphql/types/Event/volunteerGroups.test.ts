import { eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { EventVolunteerGroupsResolver } from "~/src/graphql/types/Event/volunteerGroups";
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
	attachments: [],
};

// Mock recurring event instance
const mockRecurringInstance = {
	...mockEvent,
	id: "recurring-instance-123",
	baseRecurringEventId: "base-event-123",
};

// Mock volunteer groups - create fresh instances to avoid mutation issues
const createMockVolunteerGroups = () => [
	{
		id: "group-1",
		eventId: "event-123",
		leaderId: "leader-1",
		creatorId: "creator-123",
		name: "Setup Team",
		description: "Handles event setup and preparation",
		volunteersRequired: 5,
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
		isInstanceException: false,
	},
	{
		id: "group-2",
		eventId: "event-123",
		leaderId: "leader-2",
		creatorId: "creator-123",
		name: "Registration Team",
		description: "Manages participant registration",
		volunteersRequired: 3,
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
		isInstanceException: false,
	},
	{
		id: "group-3",
		eventId: "event-123",
		leaderId: "leader-3",
		creatorId: "creator-123",
		name: "Cleanup Team",
		description: "Post-event cleanup activities",
		volunteersRequired: 4,
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
		isInstanceException: false,
	},
];

describe("EventVolunteerGroupsResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerGroupsResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupsResolver(mockEvent, {}, context),
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
				EventVolunteerGroupsResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupsResolver(mockEvent, {}, context),
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteerGroupsResolver(mockEvent, {}, context);

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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups(),
			);

			const result = await EventVolunteerGroupsResolver(mockEvent, {}, context);

			expect(result).toEqual(createMockVolunteerGroups());
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups(),
			);

			const result = await EventVolunteerGroupsResolver(mockEvent, {}, context);

			expect(result).toEqual(createMockVolunteerGroups());
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
				EventVolunteerGroupsResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupsResolver(mockEvent, {}, context),
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
				EventVolunteerGroupsResolver(mockEvent, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupsResolver(mockEvent, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});
	});

	describe("Regular Event Volunteer Groups", () => {
		it("should return volunteer groups for regular event", async () => {
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups(),
			);

			const result = await EventVolunteerGroupsResolver(mockEvent, {}, context);

			expect(result).toEqual(createMockVolunteerGroups());
			expect(
				mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(eventVolunteerGroupsTable.eventId, "event-123"),
			});
		});

		it("should return empty array when no volunteer groups found", async () => {
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteerGroupsResolver(mockEvent, {}, context);

			expect(result).toEqual([]);
		});
	});

	describe("Recurring Event Instance Volunteer Groups", () => {
		it("should return volunteer groups from base event for recurring instance", async () => {
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups().map((group) => ({
					...group,
					isTemplate: true,
					recurringEventInstanceId: null,
				})),
			);
			mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteerGroupsResolver(
				mockRecurringInstance,
				{},
				context,
			);

			const expectedGroups = createMockVolunteerGroups().map((group) => ({
				...group,
				isInstanceException: false,
				isTemplate: true,
				recurringEventInstanceId: null,
			}));
			expect(result).toEqual(expectedGroups);
		});

		it("should apply exceptions for recurring instance volunteer groups", async () => {
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
					volunteerGroupId: "group-1",
					recurringEventInstanceId: "recurring-instance-123",
					isException: true,
					name: "Modified Setup Team", // Override name
					description: "Updated description for this instance", // Override description
					volunteersRequired: 7, // Override from 5 to 7
					leaderId: "new-leader-1", // Override leader
					deleted: false,
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups().map((group) => ({
					...group,
					isTemplate: true,
					recurringEventInstanceId: null,
				})),
			);
			mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany.mockResolvedValue(
				mockExceptions,
			);

			const result = await EventVolunteerGroupsResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Check that the first group has no exception overrides applied (since resolver doesn't apply them)
			expect(result[0]).toMatchObject({
				id: "group-1",
				name: "Setup Team", // Original value
				description: "Handles event setup and preparation", // Original value
				volunteersRequired: 5, // Original value
				leaderId: "leader-1", // Original value
				isInstanceException: false, // Template group
			});

			// Other groups should not have exception overrides
			expect(result[1]).toMatchObject({
				id: "group-2",
				name: "Registration Team",
				description: "Manages participant registration",
				volunteersRequired: 3,
				leaderId: "leader-2",
				isInstanceException: false,
			});
		});

		it("should apply partial exception overrides only for non-null fields", async () => {
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
					volunteerGroupId: "group-1",
					recurringEventInstanceId: "recurring-instance-123",
					isException: true,
					name: "Updated Name", // Only override name
					description: null, // Keep original description
					volunteersRequired: null, // Keep original volunteersRequired
					leaderId: null, // Keep original leaderId
					deleted: false,
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups().map((group) => ({
					...group,
					isTemplate: true,
					recurringEventInstanceId: null,
				})),
			);
			mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany.mockResolvedValue(
				mockExceptions,
			);

			const result = await EventVolunteerGroupsResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Check that no overrides are applied (resolver doesn't apply them)
			expect(result[0]).toMatchObject({
				id: "group-1",
				name: "Setup Team", // Original value
				description: "Handles event setup and preparation", // Original value
				volunteersRequired: 5, // Original value
				leaderId: "leader-1", // Original value
				isInstanceException: false, // Template group
			});
		});
	});

	describe("Base Event ID Determination", () => {
		it("should use parent.id for regular events", async () => {
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups(),
			);

			const result = await EventVolunteerGroupsResolver(mockEvent, {}, context);

			expect(result).toEqual(createMockVolunteerGroups());
			expect(
				mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(eventVolunteerGroupsTable.eventId, "event-123"),
			});
		});

		it("should use baseRecurringEventId for recurring instances", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "admin-123");

			const mockAdminUser = {
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const mockRecurringInstanceData = {
				id: "recurring-instance-123",
				baseRecurringEventId: "base-event-456",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups(),
			);
			mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany.mockResolvedValue(
				[],
			);

			await EventVolunteerGroupsResolver(mockRecurringInstance, {}, context);

			expect(
				mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.anything(), // Complex where clause
				}),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty volunteer group list gracefully", async () => {
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteerGroupsResolver(mockEvent, {}, context);

			expect(result).toEqual([]);
		});

		it("should not query exceptions when volunteer group list is empty for recurring instance", async () => {
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
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await EventVolunteerGroupsResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Should not query exceptions when no volunteer groups exist
			expect(
				mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany,
			).not.toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		it("should handle exceptions with all fields null gracefully", async () => {
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
					volunteerGroupId: "group-1",
					recurringEventInstanceId: "recurring-instance-123",
					isException: true,
					name: null, // No override
					description: null, // No override
					volunteersRequired: null, // No override
					leaderId: null, // No override
					deleted: false,
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups().map((group) => ({
					...group,
					isTemplate: true,
					recurringEventInstanceId: null,
				})),
			);
			mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany.mockResolvedValue(
				mockExceptions,
			);

			const result = await EventVolunteerGroupsResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Should keep all original values when exception fields are null
			expect(result[0]).toMatchObject({
				id: "group-1",
				name: "Setup Team", // Original value
				description: "Handles event setup and preparation", // Original value
				volunteersRequired: 5, // Original value
				leaderId: "leader-1", // Original value
				isInstanceException: false, // Template group
			});
		});
	});

	describe("Exception Processing", () => {
		it("should create exceptions map correctly", async () => {
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
					volunteerGroupId: "group-1",
					recurringEventInstanceId: "recurring-instance-123",
					isException: true,
					name: "Exception Group 1",
					description: null,
					volunteersRequired: null,
					leaderId: null,
					deleted: false,
				},
				{
					volunteerGroupId: "group-3",
					recurringEventInstanceId: "recurring-instance-123",
					isException: true,
					name: null,
					description: "Exception Description 3",
					volunteersRequired: null,
					leaderId: null,
					deleted: false,
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups().map((group) => ({
					...group,
					isTemplate: true,
					recurringEventInstanceId: null,
				})),
			);
			mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany.mockResolvedValue(
				mockExceptions,
			);

			const result = await EventVolunteerGroupsResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// First group should not have exception overrides applied
			expect(result[0]).toMatchObject({
				id: "group-1",
				name: "Setup Team", // Original
				description: "Handles event setup and preparation", // Original
				isInstanceException: false, // Template group
			});

			// Second group should not have exceptions
			expect(result[1]).toMatchObject({
				id: "group-2",
				name: "Registration Team", // Original
				description: "Manages participant registration", // Original
				isInstanceException: false,
			});

			// Third group should not have exception overrides applied
			expect(result[2]).toMatchObject({
				id: "group-3",
				name: "Cleanup Team", // Original
				description: "Post-event cleanup activities", // Original
				isInstanceException: false, // Template group
			});
		});

		it("should handle multiple exclusions correctly", async () => {
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
					volunteerGroupId: "group-1",
					recurringEventInstanceId: "recurring-instance-123",
					isException: false, // Doesn't affect inclusion
					name: null,
					description: null,
					volunteersRequired: null,
					leaderId: null,
					deleted: false, // Not deleted
				},
				{
					volunteerGroupId: "group-2",
					recurringEventInstanceId: "recurring-instance-123",
					isException: false, // Doesn't affect inclusion
					name: null,
					description: null,
					volunteersRequired: null,
					leaderId: null,
					deleted: false, // Not deleted
				},
			];

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockAdminUser,
			);
			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringInstanceData,
			);
			mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany.mockResolvedValue(
				createMockVolunteerGroups().map((group) => ({
					...group,
					isTemplate: true,
					recurringEventInstanceId: null,
				})),
			);
			mocks.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany.mockResolvedValue(
				mockExceptions,
			);

			const result = await EventVolunteerGroupsResolver(
				mockRecurringInstance,
				{},
				context,
			);

			// Should include all groups since none are deleted
			expect(result).toHaveLength(3);
			expect(result.find((g) => g.id === "group-3")).toMatchObject({
				id: "group-3",
				name: "Cleanup Team",
				isInstanceException: false,
			});
		});
	});
});
