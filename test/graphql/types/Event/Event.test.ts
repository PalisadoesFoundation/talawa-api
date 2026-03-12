import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { formatRecurrenceDescription } from "~/src/utilities/recurrenceFormatter";
import { escapeHTML } from "~/src/utilities/sanitizer";

const { implementSpy, objectRefSpy } = vi.hoisted(() => {
	const implement = vi.fn();
	const objectRef = vi.fn(() => ({ implement }));
	return { implementSpy: implement, objectRefSpy: objectRef };
});

vi.mock("~/src/graphql/builder", () => ({
	builder: {
		objectRef: objectRefSpy,
	},
}));

vi.mock("~/src/utilities/sanitizer", () => ({
	escapeHTML: vi.fn((value: string) => `escaped_${value}`),
}));

vi.mock("~/src/utilities/recurrenceFormatter", () => ({
	formatRecurrenceDescription: vi.fn(() => "Every week on Monday"),
}));

vi.mock("~/src/graphql/types/EventAttachment/EventAttachment", () => ({
	EventAttachment: {},
}));

vi.mock("~/src/graphql/types/RecurrenceRule/RecurrenceRule", () => ({
	RecurrenceRule: {},
}));

type ResolverField = {
	resolve: (...args: unknown[]) => unknown;
};

type EventFieldMap = {
	attachments: ResolverField;
	name: ResolverField;
	description: ResolverField;
	startAt: ResolverField;
	endAt: ResolverField;
	startDate: ResolverField;
	endDate: ResolverField;
	baseEvent: ResolverField;
	progressLabel: ResolverField;
	recurrenceRule: ResolverField;
	recurrenceDescription: ResolverField;
	isGenerated: ResolverField;
};

describe("Event GraphQL Type", () => {
	let ctx: GraphQLContext;
	let mockEvent: EventType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let fields: EventFieldMap;

	beforeAll(async () => {
		await import("~/src/graphql/types/Event/Event");

		const implementCall = implementSpy.mock.calls[0]?.[0];
		const fieldsFactory = implementCall.fields;

		const tStub = {
			field: vi.fn((opts) => opts),
			string: vi.fn((opts) => opts),
			exposeID: vi.fn((_name, opts) => opts),
			exposeBoolean: vi.fn((_name, opts) => opts),
			exposeString: vi.fn((_name, opts) => opts),
			boolean: vi.fn((opts) => opts),
			int: vi.fn((opts) => opts),
			id: vi.fn((opts) => opts),
			listRef: vi.fn((_ref) => ({ __listOf: _ref })),
		};

		fields = fieldsFactory(tStub) as EventFieldMap;
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockEvent = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Event",
			description: "Test Description",
			startAt: new Date("2026-01-01T10:00:00Z"),
			endAt: new Date("2026-01-01T11:00:00Z"),
			organizationId: "789e1234-e89b-12d3-a456-426614174002",
			createdAt: new Date("2026-01-01T09:00:00Z"),
			updatedAt: new Date("2026-01-01T09:30:00Z"),
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			updaterId: "223e4567-e89b-12d3-a456-426614174001",
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			location: "Room A",
			isRecurringEventTemplate: false,
			startDate: null,
			endDate: null,
			attachments: [],
		} as unknown as EventType;

		vi.restoreAllMocks();
	});

	describe("attachments resolver", () => {
		it("should return event attachments when already present", async () => {
			const result = await fields.attachments.resolve(
				{ ...mockEvent, attachments: [{ id: "a1" }] },
				{},
				ctx,
			);

			expect(result).toEqual([{ id: "a1" }]);
			expect(
				mocks.drizzleClient.query.eventAttachmentsTable.findMany,
			).not.toHaveBeenCalled();
		});

		it("should fetch base event attachments for generated instances", async () => {
			mocks.drizzleClient.query.eventAttachmentsTable.findMany.mockResolvedValue(
				[{ id: "base-attachment" }],
			);

			const result = await fields.attachments.resolve(
				{
					...mockEvent,
					attachments: [],
					baseRecurringEventId: "base-event-id",
				},
				{},
				ctx,
			);

			expect(result).toEqual([{ id: "base-attachment" }]);
			expect(
				mocks.drizzleClient.query.eventAttachmentsTable.findMany,
			).toHaveBeenCalledTimes(1);
		});

		it("should return empty array when no attachments and no base event", async () => {
			const result = await fields.attachments.resolve(
				{ ...mockEvent, attachments: [] },
				{},
				ctx,
			);

			expect(result).toEqual([]);
		});
	});

	describe("string/date resolvers", () => {
		it("should escape name and description", () => {
			const name = fields.name.resolve({ ...mockEvent, name: "<b>Unsafe</b>" });
			const description = fields.description.resolve({
				...mockEvent,
				description: "<script>alert(1)</script>",
			});

			expect(name).toBe("escaped_<b>Unsafe</b>");
			expect(description).toBe("escaped_<script>alert(1)</script>");
			expect(escapeHTML).toHaveBeenCalledWith("<b>Unsafe</b>");
			expect(escapeHTML).toHaveBeenCalledWith("<script>alert(1)</script>");
		});

		it("should return null for empty description", () => {
			const description = fields.description.resolve({
				...mockEvent,
				description: "",
			});

			expect(description).toBeNull();
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("should use actualStartTime/actualEndTime when present", () => {
			const actualStart = new Date("2026-01-02T10:00:00Z");
			const actualEnd = new Date("2026-01-02T11:00:00Z");

			expect(
				fields.startAt.resolve({ ...mockEvent, actualStartTime: actualStart }),
			).toEqual(actualStart);
			expect(
				fields.endAt.resolve({ ...mockEvent, actualEndTime: actualEnd }),
			).toEqual(actualEnd);
		});

		it("should resolve and escape startDate and endDate", () => {
			const startDate = fields.startDate.resolve({
				...mockEvent,
				actualStartDate: "2026-01-01",
			});
			const endDate = fields.endDate.resolve({
				...mockEvent,
				endDate: "2026-01-02",
			});

			expect(startDate).toBe("escaped_2026-01-01");
			expect(endDate).toBe("escaped_2026-01-02");
			expect(escapeHTML).toHaveBeenCalledWith("2026-01-01");
			expect(escapeHTML).toHaveBeenCalledWith("2026-01-02");
		});
	});

	describe("recurrence and metadata resolvers", () => {
		it("should resolve baseEvent when baseRecurringEventId exists", async () => {
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
				id: "base-id",
				name: "Base Event",
			});

			const result = await fields.baseEvent.resolve(
				{ ...mockEvent, baseRecurringEventId: "base-id" },
				{},
				ctx,
			);

			expect(result).toEqual({
				id: "base-id",
				name: "Base Event",
				attachments: [],
			});
		});

		it("should resolve progressLabel for finite and infinite series", () => {
			expect(
				fields.progressLabel.resolve({ sequenceNumber: 2, totalCount: 10 }),
			).toBe("escaped_2 of 10");
			expect(
				fields.progressLabel.resolve({ sequenceNumber: 5, totalCount: null }),
			).toBe("escaped_#5");
			expect(fields.progressLabel.resolve({ ...mockEvent })).toBeNull();
		});

		it("should resolve recurrenceRule by recurrenceRuleId", async () => {
			mocks.drizzleClient.query.recurrenceRulesTable.findFirst.mockResolvedValue(
				{ id: "rr1", frequency: "weekly" },
			);

			const result = await fields.recurrenceRule.resolve(
				{ ...mockEvent, recurrenceRuleId: "rr1" },
				{},
				ctx,
			);

			expect(result).toEqual({ id: "rr1", frequency: "weekly" });
		});

		it("should resolve recurrenceRule by baseRecurringEventId", async () => {
			mocks.drizzleClient.query.recurrenceRulesTable.findFirst.mockResolvedValue(
				{ id: "rr-base", frequency: "daily" },
			);

			const result = await fields.recurrenceRule.resolve(
				{
					...mockEvent,
					recurrenceRuleId: null,
					baseRecurringEventId: "base-event-id",
				},
				{},
				ctx,
			);

			expect(result).toEqual({ id: "rr-base", frequency: "daily" });
		});

		it("should resolve recurrenceRule for recurring template by event id", async () => {
			mocks.drizzleClient.query.recurrenceRulesTable.findFirst.mockResolvedValue(
				{ id: "rr-template", frequency: "monthly" },
			);

			const result = await fields.recurrenceRule.resolve(
				{
					...mockEvent,
					recurrenceRuleId: null,
					baseRecurringEventId: null,
					isRecurringEventTemplate: true,
				},
				{},
				ctx,
			);

			expect(result).toEqual({ id: "rr-template", frequency: "monthly" });
		});

		it("should resolve recurrenceDescription and escape formatter output", async () => {
			mocks.drizzleClient.query.recurrenceRulesTable.findFirst.mockResolvedValue(
				{ id: "rr2", frequency: "weekly" },
			);

			const result = await fields.recurrenceDescription.resolve(
				{ ...mockEvent, recurrenceRuleId: "rr2" },
				{},
				ctx,
			);

			expect(formatRecurrenceDescription).toHaveBeenCalledWith({
				id: "rr2",
				frequency: "weekly",
			});
			expect(result).toBe("escaped_Every week on Monday");
		});

		it("should resolve recurrenceDescription by baseRecurringEventId", async () => {
			mocks.drizzleClient.query.recurrenceRulesTable.findFirst.mockResolvedValue(
				{ id: "rr3", frequency: "daily" },
			);

			const result = await fields.recurrenceDescription.resolve(
				{
					...mockEvent,
					recurrenceRuleId: null,
					baseRecurringEventId: "base-event-id",
				},
				{},
				ctx,
			);

			expect(formatRecurrenceDescription).toHaveBeenCalledWith({
				id: "rr3",
				frequency: "daily",
			});
			expect(result).toBe("escaped_Every week on Monday");
		});

		it("should resolve recurrenceDescription for recurring template by event id", async () => {
			mocks.drizzleClient.query.recurrenceRulesTable.findFirst.mockResolvedValue(
				{ id: "rr4", frequency: "yearly" },
			);

			const result = await fields.recurrenceDescription.resolve(
				{
					...mockEvent,
					recurrenceRuleId: null,
					baseRecurringEventId: null,
					isRecurringEventTemplate: true,
				},
				{},
				ctx,
			);

			expect(formatRecurrenceDescription).toHaveBeenCalledWith({
				id: "rr4",
				frequency: "yearly",
			});
			expect(result).toBe("escaped_Every week on Monday");
		});

		it("should return null when recurrenceDescription has no matching rule", async () => {
			mocks.drizzleClient.query.recurrenceRulesTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await fields.recurrenceDescription.resolve(
				{
					...mockEvent,
					recurrenceRuleId: null,
					baseRecurringEventId: "base-event-id",
				},
				{},
				ctx,
			);

			expect(result).toBeNull();
			expect(formatRecurrenceDescription).not.toHaveBeenCalled();
		});

		it("should resolve isGenerated using explicit flag or baseRecurringEventId", () => {
			expect(fields.isGenerated.resolve({ isGenerated: true })).toBe(true);
			expect(
				fields.isGenerated.resolve({
					isGenerated: false,
					baseRecurringEventId: "base-id",
				}),
			).toBe(true);
			expect(fields.isGenerated.resolve({ isGenerated: false })).toBe(false);
		});
	});
});
