import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStandaloneEventsByIds } from "~/src/graphql/types/Query/eventQueries/standaloneEventQueries";
import {
	type EventWithAttachments,
	getEventsByIds,
} from "~/src/graphql/types/Query/eventQueries/unifiedEventQueries";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

// Mock dependencies
const mockDrizzleClient = {} as unknown as ServiceDependencies["drizzleClient"];
const mockLogger = {
	error: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
} as unknown as ServiceDependencies["logger"];

// NOTE: Unit mocks are intentionally used here instead of mercuriusClient integration tests
// because getEventsByIds is a utility function that orchestrates calls to getStandaloneEventsByIds
// and getRecurringEventInstancesByIds. Testing the orchestration logic in isolation allows us to
// verify the coordination behavior without depending on database state. Integration tests for the
// full GraphQL stack are covered in test/graphql/types/Query/*.test.ts files.
vi.mock(
	"~/src/graphql/types/Query/eventQueries/standaloneEventQueries",
	() => ({
		getStandaloneEventsByIds: vi.fn(),
	}),
);

vi.mock(
	"~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries",
	() => ({
		getRecurringEventInstancesByIds: vi.fn(),
	}),
);

describe("getEventsByIds", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should preserve recurring event template properties when returning templates", async () => {
		const templateId = "template-1";
		// Mock standalone events returning a template
		const mockTemplateEvent = {
			id: templateId,
			name: "Recurring Template",
			isRecurringEventTemplate: true,
			eventType: "standalone",
			baseRecurringEventId: null,
			// Add minimal required fields to satisfy type if needed, or stick to 'as any'
			organizationId: "org-1",
			creatorId: "user-1",
			startAt: new Date(),
			endAt: new Date(),
		};

		vi.mocked(getStandaloneEventsByIds).mockResolvedValueOnce([
			mockTemplateEvent as unknown as EventWithAttachments,
		]);

		const result = await getEventsByIds(
			[templateId],
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toHaveLength(1);
		const event = result[0];

		// Expected behavior verification
		expect(event).toBeDefined();
		if (event) {
			expect(event.id).toBe(templateId);
			expect(event.isRecurringEventTemplate).toBe(true);
			expect(event.isGenerated).toBe(false);
			expect(event.baseRecurringEventId).toBeNull();
			expect(event.eventType).toBe("standalone");
		}

		// Verify getStandaloneEventsByIds was called with includeTemplates: true
		expect(getStandaloneEventsByIds).toHaveBeenCalledWith(
			[templateId],
			mockDrizzleClient,
			mockLogger,
			{ includeTemplates: true },
		);
	});
});
