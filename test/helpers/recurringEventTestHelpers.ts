import { faker } from "@faker-js/faker";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { assertToBeNonNullish } from "../helpers";
import { server } from "../server";

/**
 * Helper to create a recurring event template and instances for testing.
 *
 * @param organizationId - The ID of the organization.
 * @param creatorId - The ID of the creator user.
 * @param options - Optional configuration for creating instances.
 * @returns Object containing the template ID and created instance IDs.
 */
export async function createRecurringEventWithInstances(
	organizationId: string,
	creatorId: string,
	options: {
		instanceCount?: number;
		startDate?: Date;
		interval?: number; // Days
	} = {},
): Promise<{ templateId: string; instanceIds: string[] }> {
	const instanceCount = options.instanceCount ?? 3;
	const startDate = options.startDate ?? new Date("2024-01-01T09:00:00Z");
	const interval = options.interval ?? 1;

	const originalSeriesId = faker.string.uuid();

	// Create recurring event template
	const [template] = await server.drizzleClient
		.insert(eventsTable)
		.values({
			name: `Test Recurring Event ${faker.string.uuid()}`,
			description: "Daily team standup meeting",
			organizationId,
			creatorId,
			isRecurringEventTemplate: true,
			startAt: startDate,
			endAt: new Date(startDate.getTime() + 30 * 60 * 1000), // 30 mins later
			allDay: false,
			location: "Meeting Room A",
			isPublic: true,
			isRegisterable: false,
		})
		.returning();

	assertToBeNonNullish(template);

	// Create recurrence rule
	const recurrenceEndDate = new Date(startDate);
	recurrenceEndDate.setDate(startDate.getDate() + instanceCount * interval);

	const [recurrenceRule] = await server.drizzleClient
		.insert(recurrenceRulesTable)
		.values({
			baseRecurringEventId: template.id,
			originalSeriesId,
			recurrenceStartDate: startDate,
			recurrenceEndDate,
			frequency: "DAILY",
			interval,
			organizationId,
			creatorId,
			recurrenceRuleString: `RRULE:FREQ=DAILY;INTERVAL=${interval}`,
			latestInstanceDate: recurrenceEndDate,
		})
		.returning();

	assertToBeNonNullish(recurrenceRule);

	// Create multiple instances
	const instancesData = [];

	for (let i = 0; i < instanceCount; i++) {
		const instanceStart = new Date(startDate);
		instanceStart.setDate(startDate.getDate() + i * interval);

		const instanceEnd = new Date(instanceStart);
		instanceEnd.setTime(instanceStart.getTime() + 30 * 60 * 1000);

		instancesData.push({
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: instanceStart,
			actualStartTime: instanceStart,
			actualEndTime: instanceEnd,
			sequenceNumber: i + 1,
		});
	}

	const instances = await server.drizzleClient
		.insert(recurringEventInstancesTable)
		.values(instancesData)
		.returning();

	// Return IDs sorted by start time (which matches insertion order here)
	return {
		templateId: template.id,
		instanceIds: instances.map((i) => i.id),
	};
}

/**
 * Helper to cancel specific recurring event instances.
 *
 * @param instanceIds - Array of instance IDs to cancel.
 */
export async function cancelInstances(instanceIds: string[]) {
	if (instanceIds.length === 0) return;

	// Drizzle update with inArray
	const { inArray } = await import("drizzle-orm");
	await server.drizzleClient
		.update(recurringEventInstancesTable)
		.set({ isCancelled: true })
		.where(inArray(recurringEventInstancesTable.id, instanceIds));
}
