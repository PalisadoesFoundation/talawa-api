import { describe, expect, it } from "vitest";
import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import { mapRecurringInstanceToEvent } from "~/src/graphql/utils/mapRecurringInstanceToEvent";

describe("mapRecurringInstanceToEvent", () => {
	it("correctly maps a recurring instance to an EventWithAttachments object", () => {
		const instance: ResolvedRecurringEventInstance = {
			id: "instance-1",
			name: "Test Event",
			description: "A test event description",
			actualStartTime: new Date("2023-10-01T10:00:00Z"),
			actualEndTime: new Date("2023-10-01T11:00:00Z"),
			location: "Room 101",
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			organizationId: "org-1",
			creatorId: "user-1",
			updaterId: "user-1",
			createdAt: new Date("2023-09-01T10:00:00Z"),
			updatedAt: new Date("2023-09-02T10:00:00Z"),
			isCancelled: false,
			baseRecurringEventId: "base-1",
			sequenceNumber: 1,
			totalCount: 5,
			hasExceptions: false,
			// These might not be in ResolvedRecurringEventInstance strictly depending on type defs,
			// but assuming based on usage in other files
		} as unknown as ResolvedRecurringEventInstance;

		const result = mapRecurringInstanceToEvent(instance);

		expect(result).toMatchObject({
			id: "instance-1",
			name: "Test Event",
			description: "A test event description",
			startAt: new Date("2023-10-01T10:00:00Z"),
			endAt: new Date("2023-10-01T11:00:00Z"),
			location: "Room 101",
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			organizationId: "org-1",
			creatorId: "user-1",
			updaterId: "user-1",
			createdAt: new Date("2023-09-01T10:00:00Z"),
			updatedAt: new Date("2023-09-02T10:00:00Z"),
			isRecurringEventTemplate: false,
			baseRecurringEventId: "base-1",
			sequenceNumber: 1,
			totalCount: 5,
			hasExceptions: false,
			attachments: [],
			eventType: "generated",
			isGenerated: true,
		});
	});
});
