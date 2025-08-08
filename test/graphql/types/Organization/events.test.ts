import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Organization as OrganizationType } from "~/src/graphql/types/Organization/Organization";
import { getUnifiedEventsInDateRange } from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock the external dependency
vi.mock("~/src/graphql/types/Query/eventQueries", () => ({
	getUnifiedEventsInDateRange: vi.fn(),
}));

const mockGetUnifiedEventsInDateRange = vi.mocked(getUnifiedEventsInDateRange);

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

type EventsResolver = GraphQLFieldResolver<
	OrganizationType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("Organization Events Resolver Tests", () => {
	let mockOrganization: OrganizationType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let eventsResolver: EventsResolver;

	const mockEvents = [
		{
			id: "event-1",
			name: "Test Event 1",
			startAt: new Date("2024-07-20T10:00:00Z"),
			endAt: new Date("2024-07-20T11:00:00Z"),
			eventType: "standalone" as const,
			title: "Test Event 1",
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
			id: "event-2",
			name: "Test Event 2",
			startAt: new Date("2024-07-21T14:00:00Z"),
			endAt: new Date("2024-07-21T15:00:00Z"),
			eventType: "generated" as const,
			title: "Test Event 2",
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

	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	beforeAll(() => {
		const organizationType = schema.getType(
			"Organization",
		) as GraphQLObjectType;
		const eventsField = organizationType.getFields().events;
		if (!eventsField) {
			throw new Error("Events field not found on Organization type");
		}
		eventsResolver = eventsField.resolve as EventsResolver;
		if (!eventsResolver) {
			throw new Error("Events resolver not found on Organization type");
		}
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockOrganization = {
			id: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			name: "Test Organization",
			description: "Test Description",
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date("2024-02-07T10:30:00.000Z"),
			updatedAt: new Date("2024-02-07T12:00:00.000Z"),
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			updaterId: null,
			state: null,
			postalCode: null,
			userRegistrationRequired: false,
		};
		mockGetUnifiedEventsInDateRange.mockClear();
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(
				eventsResolver(mockOrganization, { first: 10 }, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);
			await expect(
				eventsResolver(mockOrganization, { first: 10 }, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should execute user query with correct currentUserId", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);

			await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			// Verify the user query was called with correct parameters
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				columns: {
					role: true,
				},
				with: {
					organizationMembershipsWhereMember: {
						columns: {
							role: true,
						},
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			});
		});

		it("should throw unauthorized_action for non-admin with no organization membership", async () => {
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

		it("should allow system administrator access", async () => {
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

		it("should allow organization member access", async () => {
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

		it("should allow organization administrator access", async () => {
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

	describe("Argument Validation", () => {
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
					limit: 5,
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
				title: `Test Event ${i}`,
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
			// This test specifically targets the isInversed: false initialization (line 63)
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
