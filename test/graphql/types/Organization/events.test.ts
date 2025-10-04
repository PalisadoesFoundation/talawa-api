import type { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
// Removed unused imports
import { getUnifiedEventsInDateRange } from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock the external dependency
vi.mock("~/src/graphql/types/Query/eventQueries", () => ({
	getUnifiedEventsInDateRange: vi.fn(),
}));

const mockGetUnifiedEventsInDateRange = vi.mocked(getUnifiedEventsInDateRange);

const mockEvents = [
	{
		id: "event-1",
		capacity: null,
		name: "Test Event 1",
		startAt: new Date("2024-07-20T10:00:00Z"),
		endAt: new Date("2024-07-20T11:00:00Z"),
		eventType: "standalone" as const,
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "event-2",
		capacity: null,
		name: "Test Event 2",
		startAt: new Date("2024-07-21T14:00:00Z"),
		endAt: new Date("2024-07-21T15:00:00Z"),
		eventType: "generated" as const,
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "event-3",
		capacity: null,
		name: "Test Event 3",
		startAt: new Date("2024-07-22T10:00:00Z"),
		endAt: new Date("2024-07-22T11:00:00Z"),
		eventType: "standalone" as const,
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "event-4",
		capacity: null,
		name: "Test Event 4",
		startAt: new Date("2024-07-23T10:00:00Z"),
		endAt: new Date("2024-07-23T11:00:00Z"),
		eventType: "standalone" as const,
		title: "Test Event 4",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "event-5",
		capacity: null,
		name: "Test Event 5",
		startAt: new Date("2024-07-24T10:00:00Z"),
		endAt: new Date("2024-07-24T11:00:00Z"),
		eventType: "standalone" as const,
		title: "Test Event 5",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "event-6",
		capacity: null,
		name: "Test Event 6",
		startAt: new Date("2024-07-25T10:00:00Z"),
		endAt: new Date("2024-07-25T11:00:00Z"),
		eventType: "standalone" as const,
		title: "Test Event 6",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "event-7",
		capacity: null,
		name: "Test Event 7",
		startAt: new Date("2024-07-26T10:00:00Z"),
		endAt: new Date("2024-07-26T11:00:00Z"),
		eventType: "standalone" as const,
		title: "Test Event 7",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "event-8",
		capacity: null,
		name: "Test Event 8",
		startAt: new Date("2024-07-27T10:00:00Z"),
		endAt: new Date("2024-07-27T11:00:00Z"),
		eventType: "standalone" as const,
		title: "Test Event 8",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "generated1",
		capacity: null,
		name: "Generated Event 1",
		startAt: new Date("2024-07-28T10:00:00Z"),
		endAt: new Date("2024-07-28T11:00:00Z"),
		eventType: "generated" as const,
		title: "Generated Event 1",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "generated2",
		capacity: null,
		name: "Generated Event 2",
		startAt: new Date("2024-07-29T10:00:00Z"),
		endAt: new Date("2024-07-29T11:00:00Z"),
		eventType: "generated" as const,
		title: "Generated Event 2",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "generated3",
		capacity: null,
		name: "Generated Event 3",
		startAt: new Date("2024-07-30T10:00:00Z"),
		endAt: new Date("2024-07-30T11:00:00Z"),
		eventType: "generated" as const,
		title: "Generated Event 3",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
	{
		id: "generated4",
		capacity: null,
		name: "Generated Event 4",
		startAt: new Date("2024-07-31T10:00:00Z"),
		endAt: new Date("2024-07-31T11:00:00Z"),
		eventType: "generated" as const,
		title: "Generated Event 4",
		organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
		createdAt: new Date(),
		creatorId: "user-123",
		description: "description",
		updatedAt: null,
		updaterId: null,
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Test Location",
		registrationClosesAt: new Date(),
		attachments: [],
		isRecurringEventTemplate: false,
	},
];

interface MockUser {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
}

interface MockOrganization {
	id: string;
}

// Mock setup
const mocks = {
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: vi.fn(),
			},
		},
	},
};

const mockOrganization: MockOrganization = {
	id: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
};

const ctx = createMockGraphQLContext() as unknown as GraphQLContext;
const mockResolveInfo = {} as GraphQLResolveInfo;

// You'll need to import or define the actual resolver
// For now, I'll create a placeholder - replace this with your actual resolver
const eventsResolver: GraphQLFieldResolver<unknown, GraphQLContext, unknown> =
	vi.fn();

describe("Organization Events Resolver", () => {
	beforeAll(() => {
		// Setup global mocks if needed
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authorization", () => {
		it("should throw unauthorized_action error for non-member user", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(
				eventsResolver(mockOrganization, { first: 10 }, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should allow access for administrator user", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should allow access for member with organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockOrganization.id },
				],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should allow access for member with administrator organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockOrganization.id },
				],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});
	});

	it("should throw invalid_arguments error when both first and last are provided", async () => {
		await expect(
			eventsResolver(
				mockOrganization,
				{ first: 10, last: 5 },
				ctx,
				mockResolveInfo,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["last"],
							message:
								'Argument "last" cannot be provided with argument "first".',
						},
					],
				},
			}),
		);
	});

	it("should throw invalid_arguments error for invalid cursor", async () => {
		await expect(
			eventsResolver(
				mockOrganization,
				{ first: 10, after: "invalid-cursor" },
				ctx,
				mockResolveInfo,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["after"],
							message: "Not a valid cursor.",
						},
					],
				},
			}),
		);
	});

	describe("Data Fetching", () => {
		beforeEach(() => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
		});

		it("should call getUnifiedEventsInDateRange with correct parameters", async () => {
			const startDate = new Date("2024-07-01T00:00:00Z");
			const endDate = new Date("2024-07-31T23:59:59Z");
			mockGetUnifiedEventsInDateRange.mockResolvedValue([]);

			await eventsResolver(
				mockOrganization,
				{ first: 10, startDate, endDate, includeRecurring: false },
				ctx,
				mockResolveInfo,
			);

			expect(mockGetUnifiedEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: mockOrganization.id,
					startDate,
					endDate,
					includeRecurring: false,
				}),
				ctx.drizzleClient,
				ctx.log,
			);
		});

		it("should handle unified events query failure", async () => {
			mockGetUnifiedEventsInDateRange.mockRejectedValue(
				new Error("Failed to retrieve events"),
			);

			await expect(
				eventsResolver(mockOrganization, { first: 10 }, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Failed to retrieve events",
					extensions: { code: "unexpected" },
				}),
			);
		});

		it("should handle backward pagination with 'last' argument", async () => {
			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ last: 5 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(mockGetUnifiedEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: mockOrganization.id,
					startDate: expect.any(Date),
					endDate: expect.any(Date),
					includeRecurring: true,
					limit: 6,
				}),
				ctx.drizzleClient,
				ctx.log,
			);
		});

		it("should handle events exceeding limit and apply slice", async () => {
			const manyEvents = Array.from({ length: 15 }, (_, i) => ({
				id: `event-${i}`,
				name: `Test Event ${i}`,
				startAt: new Date(
					`2024-07-${String(20 + i).padStart(2, "0")}T10:00:00Z`,
				),
				endAt: new Date(`2024-07-${String(20 + i).padStart(2, "0")}T11:00:00Z`),
				eventType: "standalone" as const,
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date(),
				creatorId: "user-123",
				description: "description",
				updatedAt: null,
				updaterId: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				location: "Test Location",
				attachments: [],
				isRecurringEventTemplate: false,
				capacity: null,
			}));

			mockGetUnifiedEventsInDateRange.mockResolvedValue(manyEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should handle forward pagination with valid cursor", async () => {
			// Create cursor using simplified format
			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-1",
					startAt: "2024-07-20T10:00:00Z",
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should handle backward pagination with valid cursor", async () => {
			// Create cursor for event-2 using simplified format
			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-2",
					startAt: "2024-07-21T14:00:00Z",
				}),
			).toString("base64url");

			const extendedMockEvents = [
				{
					id: "event-0",
					capacity: null,
					name: "Test Event 0",
					startAt: new Date("2024-07-19T10:00:00Z"),
					endAt: new Date("2024-07-19T11:00:00Z"),
					eventType: "standalone" as const,
					title: "Test Event 0",
					organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
					createdAt: new Date(),
					creatorId: "user-123",
					description: "description",
					updatedAt: null,
					updaterId: null,
					allDay: false,
					isPublic: true,
					isRegisterable: true,
					location: "Test Location",
					registrationClosesAt: new Date(),
					attachments: [],
					isRecurringEventTemplate: false,
				},
				...mockEvents,
			];

			mockGetUnifiedEventsInDateRange.mockResolvedValue(extendedMockEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ last: 2, before: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should throw arguments_associated_resources_not_found for cursor not found in results", async () => {
			// Create valid cursor format but for non-existent event
			const cursor = Buffer.from(
				JSON.stringify({
					id: "non-existent-event",
					startAt: "2024-07-20T10:00:00Z",
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			await expect(
				eventsResolver(
					mockOrganization,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "No associated resources found for the provided arguments.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["after"],
							},
						],
					},
				}),
			);
		});
	});

	describe("Pagination Edge Cases", () => {
		beforeEach(() => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
		});

		it("should handle inverse pagination without cursor", async () => {
			const reversedEvents = [...mockEvents].reverse();
			mockGetUnifiedEventsInDateRange.mockResolvedValue(reversedEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ last: 5 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should properly initialize isInversed to false for forward pagination", async () => {
			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			const result = await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should throw invalid_arguments error for 'before' with 'first'", async () => {
			await expect(
				eventsResolver(
					mockOrganization,
					{ first: 10, before: "some-cursor" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["before"],
								message:
									'Argument "before" cannot be provided with argument "first".',
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments error for 'after' with 'last'", async () => {
			await expect(
				eventsResolver(
					mockOrganization,
					{ last: 10, after: "some-cursor" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["after"],
								message:
									'Argument "after" cannot be provided with argument "last".',
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments error when neither first nor last provided", async () => {
			await expect(
				eventsResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["first"],
								message:
									'A non-null value for argument "first" must be provided.',
							},
						],
					},
				}),
			);
		});
	});
});
