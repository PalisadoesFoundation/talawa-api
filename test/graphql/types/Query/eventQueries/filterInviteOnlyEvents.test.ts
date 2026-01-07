import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type EventWithAttachments,
	filterInviteOnlyEvents,
} from "~/src/graphql/types/Query/eventQueries/unifiedEventQueries";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

/**
 * Unit tests for filterInviteOnlyEvents function.
 * Tests visibility rules for invite-only events.
 */
describe("filterInviteOnlyEvents", () => {
	let mockDrizzleClient: ServiceDependencies["drizzleClient"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockDrizzleClient = {
			query: {
				eventAttendeesTable: {
					findMany: vi.fn(),
				},
			},
		} as unknown as ServiceDependencies["drizzleClient"];
	});

	/**
	 * Creates a mock event for testing.
	 * @param id - Event ID
	 * @param isInviteOnly - Whether the event is invite-only
	 * @param creatorId - ID of the event creator
	 * @param eventType - Type of event (standalone or generated)
	 * @param isPublic - Whether the event is public (defaults to !isInviteOnly for convenience)
	 */
	const createMockEvent = (
		id: string,
		isInviteOnly: boolean,
		creatorId: string,
		eventType: "standalone" | "generated" = "standalone",
		isPublic?: boolean,
	): EventWithAttachments => ({
		id,
		name: `Event ${id}`,
		description: null,
		location: null,
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
		allDay: false,
		isPublic: isPublic ?? !isInviteOnly,
		isRegisterable: true,
		isInviteOnly,
		organizationId: "org-123",
		creatorId,
		createdAt: new Date(),
		updatedAt: null,
		updaterId: null,
		isRecurringEventTemplate: false,
		attachmentsPolicy: "inherit",
		timezone: "UTC",
		recurrenceRule: null,
		recurrenceUntil: null,
		attachments: [],
		eventType,
	});

	describe("Public events", () => {
		it("should return all public events regardless of user", async () => {
			const events = [
				createMockEvent("event-1", false, "creator-1"),
				createMockEvent("event-2", false, "creator-2"),
			];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(2);
			expect(result.map((e) => e.id)).toEqual(
				expect.arrayContaining(["event-1", "event-2"]),
			);
		});
	});

	describe("Invite-only events - Creator visibility", () => {
		it("should show invite-only event to creator", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1"),
				createMockEvent("event-2", false, "creator-2"),
			];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "creator-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(2);
			expect(result.map((e) => e.id)).toEqual(
				expect.arrayContaining(["event-1", "event-2"]),
			);
		});

		it("should hide invite-only event from non-creator", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1"),
				createMockEvent("event-2", false, "creator-2"),
			];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("event-2");
		});
	});

	describe("Invite-only events - Admin visibility", () => {
		it("should show invite-only events to global admin", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1"),
				createMockEvent("event-2", true, "creator-2"),
			];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "admin-1",
				currentUserRole: "administrator",
				currentUserOrgMembership: undefined,
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(2);
			expect(result.map((e) => e.id)).toEqual(
				expect.arrayContaining(["event-1", "event-2"]),
			);
		});

		it("should show invite-only events to organization admin", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1"),
				createMockEvent("event-2", true, "creator-2"),
			];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "org-admin-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "administrator" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(2);
			expect(result.map((e) => e.id)).toEqual(
				expect.arrayContaining(["event-1", "event-2"]),
			);
		});
	});

	describe("Invite-only events - Invited user visibility", () => {
		it("should show invite-only event to invited user (standalone)", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1", "standalone"),
			];

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValue([
				{
					eventId: "event-1",
					userId: "user-1",
					isInvited: true,
				},
			] as unknown as Awaited<
				ReturnType<typeof mockDrizzleClient.query.eventAttendeesTable.findMany>
			>);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("event-1");
		});

		it("should show invite-only event to invited user (recurring instance)", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1", "generated"),
			];

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValue([
				{
					recurringEventInstanceId: "event-1",
					userId: "user-1",
					isInvited: true,
				},
			] as unknown as Awaited<
				ReturnType<typeof mockDrizzleClient.query.eventAttendeesTable.findMany>
			>);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("event-1");
		});

		it("should hide invite-only event from non-invited user", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1", "standalone"),
			];

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValue([]);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(0);
		});
	});

	describe("Invite-only events - Registered user visibility", () => {
		it("should show invite-only event to registered-but-not-invited user (standalone)", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1", "standalone"),
			];

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValue([
				{
					eventId: "event-1",
					userId: "user-1",
					isInvited: false,
					isRegistered: true,
				},
			] as unknown as Awaited<
				ReturnType<typeof mockDrizzleClient.query.eventAttendeesTable.findMany>
			>);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("event-1");
		});

		it("should show invite-only event to registered-but-not-invited user (recurring instance)", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1", "generated"),
			];

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValue([
				{
					recurringEventInstanceId: "event-1",
					userId: "user-1",
					isInvited: false,
					isRegistered: true,
				},
			] as unknown as Awaited<
				ReturnType<typeof mockDrizzleClient.query.eventAttendeesTable.findMany>
			>);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("event-1");
		});
	});

	describe("Mixed events", () => {
		it("should filter correctly with mix of public and invite-only events", async () => {
			const events = [
				createMockEvent("public-1", false, "creator-1"),
				createMockEvent("invite-1", true, "creator-2"),
				createMockEvent("public-2", false, "creator-3"),
				createMockEvent("invite-2", true, "user-1"), // Creator
			];

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValue([]);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			// Should see: public-1, public-2, invite-2 (as creator)
			expect(result).toHaveLength(3);
			expect(result.map((e) => e.id)).toEqual(
				expect.arrayContaining(["public-1", "public-2", "invite-2"]),
			);
			expect(result.map((e) => e.id)).not.toContain("invite-1");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty events array", async () => {
			const result = await filterInviteOnlyEvents({
				events: [],
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(0);
		});

		it("should handle all invite-only events with no access", async () => {
			const events = [
				createMockEvent("event-1", true, "creator-1"),
				createMockEvent("event-2", true, "creator-2"),
			];

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValue([]);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(0);
		});
	});
});
