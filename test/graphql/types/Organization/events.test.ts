import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Organization as OrganizationType } from "~/src/graphql/types/Organization/Organization";
import {
	filterInviteOnlyEvents,
	getUnifiedEventsInDateRange,
} from "~/src/graphql/types/Query/eventQueries";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

afterEach(() => {
	vi.clearAllMocks();
});

// Mock the external dependency
vi.mock("~/src/graphql/types/Query/eventQueries", () => ({
	getUnifiedEventsInDateRange: vi.fn(),
	filterInviteOnlyEvents: vi.fn(),
}));

const mockGetUnifiedEventsInDateRange = vi.mocked(getUnifiedEventsInDateRange);
const mockFilterInviteOnlyEvents = vi.mocked(filterInviteOnlyEvents);

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

type EventsPreviewResolver = GraphQLFieldResolver<
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
	let eventsPreviewResolver: EventsPreviewResolver;

	const mockEvents = [
		{
			id: "event-1",
			name: "Test Event 1",
			startAt: new Date("2024-07-20T10:00:00Z"),
			endAt: new Date("2024-07-20T11:00:00Z"),
			eventType: "standalone" as const,
			title: "Test Event 1",
			organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			createdAt: new Date("2020-01-01T00:00:00Z"),
			creatorId: "user-123",
			description: "description",
			updatedAt: null,
			updaterId: null,
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			location: "Test Location",
			registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
			attachments: [],
			isRecurringEventTemplate: false,
			startDate: null,
			endDate: null,
		},
		{
			id: "event-all-day",
			name: "All Day Event",
			startAt: null,
			endAt: null,
			eventType: "standalone" as const,
			title: "All Day Event",
			organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			createdAt: new Date("2020-01-01T00:00:00Z"),
			creatorId: "user-123",
			description: "description",
			updatedAt: null,
			updaterId: null,
			allDay: true,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			location: "Test Location",
			registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
			attachments: [],
			isRecurringEventTemplate: false,
			startDate: "2024-07-21",
			endDate: "2024-07-22",
		},
		{
			id: "event-2",
			name: "Test Event 2",
			startAt: new Date("2024-07-21T14:00:00Z"),
			endAt: new Date("2024-07-21T15:00:00Z"),
			eventType: "generated" as const,
			title: "Test Event 2",
			organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			createdAt: new Date("2020-01-01T00:00:00Z"),
			creatorId: "user-123",
			description: "description",
			updatedAt: null,
			updaterId: null,
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			location: "Test Location",
			registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
			attachments: [],
			isRecurringEventTemplate: false,
			startDate: null,
			endDate: null,
		},
	];

	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	beforeAll(() => {
		const organizationType = schema.getType(
			"Organization",
		) as GraphQLObjectType;
		const eventsPreviewField = organizationType.getFields().eventsPreview;
		if (!eventsPreviewField) {
			throw new Error("eventsPreview field not found on Organization type");
		}
		eventsPreviewResolver = eventsPreviewField.resolve as EventsPreviewResolver;
		if (!eventsPreviewResolver) {
			throw new Error("eventsPreview resolver not found on Organization type");
		}

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
		// Mock filterInviteOnlyEvents to return events as-is (identity function)
		// This allows unit tests to focus on resolver logic without filtering complexity
		mockFilterInviteOnlyEvents.mockImplementation(
			async (input) => input.events,
		);
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
			const eqSpy = vi.fn();

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
						with?: {
							organizationMembershipsWhereMember?: {
								where?: (fields: unknown, operators: unknown) => void;
							};
						};
					};
					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: eqSpy };
						args.where(fields, operators);
					}
					// Execute the nested where callback
					if (args?.with?.organizationMembershipsWhereMember?.where) {
						const fields = {
							organizationId: "organizationMemberships.organizationId",
						};
						const operators = { eq: eqSpy };
						args.with.organizationMembershipsWhereMember.where(
							fields,
							operators,
						);
					}
					return Promise.resolve(mockUserData);
				},
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

			// Verify that the where clauses were actually executed with correct values
			expect(eqSpy).toHaveBeenCalledWith("users.id", "user-123");
			expect(eqSpy).toHaveBeenCalledWith(
				"organizationMemberships.organizationId",
				mockOrganization.id,
			);
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

		it("should throw invalid_arguments error for invalid cursor with last", async () => {
			await expect(
				eventsResolver(
					mockOrganization,
					{ last: 10, before: "invalid-cursor" },
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
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
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
				{ last: 5 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
			// With over-fetching: limit=6, fetchLimit = min(max(6*2, 6+50), 200) = min(max(12, 56), 200) = 56
			expect(mockGetUnifiedEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: mockOrganization.id,
					startDate: expect.any(Date),
					endDate: expect.any(Date),
					includeRecurring: true,
					limit: 56,
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
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "description",
				updatedAt: null,
				updaterId: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
				startDate: null,
				endDate: null,
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
					createdAt: new Date("2020-01-01T00:00:00Z"),
					creatorId: "user-123",
					description: "description",
					updatedAt: null,
					updaterId: null,
					allDay: false,
					isPublic: true,
					isRegisterable: true,
					isInviteOnly: false,
					location: "Test Location",
					registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
					startDate: null,
					endDate: null,
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

		it("should paginate forward correctly with an all-day cursor", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-all-day",
					startAt: "2024-07-21T00:00:00.000Z",
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);
			const result = await eventsResolver(
				mockOrganization,
				{ first: 2, after: cursor },
				ctx,
				mockResolveInfo,
			);
			const connection = result as {
				edges: Array<{ cursor: string; node: { id: string } }>;
				pageInfo: { hasPreviousPage: boolean; hasNextPage: boolean };
			};

			expect(connection.edges).toHaveLength(1);
			expect(connection.edges[0]?.node.id).toBe("event-2");
			expect(connection.pageInfo.hasPreviousPage).toBe(true);
			expect(connection.pageInfo.hasNextPage).toBe(false);

			const decodedCursor = JSON.parse(
				Buffer.from(connection.edges[0]?.cursor ?? "", "base64url").toString(
					"utf-8",
				),
			);
			expect(decodedCursor.id).toBe("event-2");
		});

		it("should paginate backward correctly with an all-day cursor", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-all-day",
					startAt: "2024-07-21T00:00:00.000Z",
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue(mockEvents);
			const result = await eventsResolver(
				mockOrganization,
				{ last: 2, before: cursor },
				ctx,
				mockResolveInfo,
			);
			const connection = result as {
				edges: Array<{ cursor: string; node: { id: string } }>;
				pageInfo: { hasPreviousPage: boolean; hasNextPage: boolean };
			};

			expect(connection.edges).toHaveLength(1);
			expect(connection.edges[0]?.node.id).toBe("event-1");
			expect(connection.pageInfo.hasNextPage).toBe(true);
			expect(connection.pageInfo.hasPreviousPage).toBe(false);

			const decodedCursor = JSON.parse(
				Buffer.from(connection.edges[0]?.cursor ?? "", "base64url").toString(
					"utf-8",
				),
			);
			expect(decodedCursor.id).toBe("event-1");
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

		it("should throw arguments_associated_resources_not_found for cursor not found in results with last", async () => {
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
					{ last: 10, before: cursor },
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
								argumentPath: ["before"],
							},
						],
					},
				}),
			);
		});

		it("should filter results to the target day when onlyStartOnDay is true", async () => {
			const startDate = new Date("2024-07-20T00:00:00.000Z");
			const endDate = new Date("2024-07-22T23:59:59.999Z");
			const baseTimedEvent = mockEvents[0];
			if (!baseTimedEvent) {
				throw new Error("Expected mock event at index 0");
			}

			const dayStartEvent = {
				...baseTimedEvent,
				id: "day-start-event",
				startAt: new Date("2024-07-20T10:00:00.000Z"),
				allDay: false,
			};

			const overlapOnlyEvent = {
				...baseTimedEvent,
				id: "overlap-only-event",
				startAt: new Date("2024-07-21T09:30:00.000Z"),
				endAt: new Date("2024-07-21T10:30:00.000Z"),
				allDay: false,
			};

			mockGetUnifiedEventsInDateRange.mockResolvedValue([
				dayStartEvent,
				overlapOnlyEvent,
			]);

			const result = await eventsResolver(
				mockOrganization,
				{ first: 10, startDate, endDate, onlyStartOnDay: true },
				ctx,
				mockResolveInfo,
			);

			const connection = result as {
				edges: Array<{ node: { id: string; startAt: Date | null } }>;
			};

			expect(connection.edges).toHaveLength(1);
			expect(connection.edges[0]?.node.id).toBe("day-start-event");

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs) {
				throw new Error("Expected getUnifiedEventsInDateRange to be called");
			}

			expect(callArgs.startDate.getTime()).toBe(startDate.getTime());
			expect(callArgs.endDate.getTime()).toBe(endDate.getTime());
		});
	});

	describe("eventsPreview Resolver", () => {
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

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should throw unauthenticated for preview when client is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventsPreviewResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				}),
			);
		});

		it("should execute preview user query predicates with currentUserId and parent.id", async () => {
			const eqSpy = vi.fn();
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
						with?: {
							organizationMembershipsWhereMember?: {
								where?: (fields: unknown, operators: unknown) => void;
							};
						};
					};

					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: eqSpy };
						args.where(fields, operators);
					}

					if (args?.with?.organizationMembershipsWhereMember?.where) {
						const fields = {
							organizationId: "organizationMemberships.organizationId",
						};
						const operators = { eq: eqSpy };
						args.with.organizationMembershipsWhereMember.where(
							fields,
							operators,
						);
					}

					return Promise.resolve(mockUserData);
				},
			);

			mockGetUnifiedEventsInDateRange.mockResolvedValue([]);

			await eventsPreviewResolver(mockOrganization, {}, ctx, mockResolveInfo);

			expect(eqSpy).toHaveBeenCalledWith("users.id", "user-123");
			expect(eqSpy).toHaveBeenCalledWith(
				"organizationMemberships.organizationId",
				mockOrganization.id,
			);
		});

		it("should throw unauthenticated for preview when current user is undefined", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				eventsPreviewResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				}),
			);
		});

		it("should throw unauthorized_action for preview when non-admin has no organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(
				eventsPreviewResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should throw invalid_arguments for preview when perDayLimit is out of range", async () => {
			try {
				await eventsPreviewResolver(
					mockOrganization,
					{ perDayLimit: 0 },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw invalid_arguments");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphQLError = error as TalawaGraphQLError;
				expect(graphQLError.extensions.code).toBe("invalid_arguments");
				expect(graphQLError.extensions.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["perDayLimit"],
							message: expect.stringMatching(/(>=\s*1|equal to 1)/i),
						}),
					]),
				);
			}
		});

		it("should group preview events by day and set hasMore when per-day cap is exceeded", async () => {
			const baseTimedEvent = mockEvents[0];
			if (!baseTimedEvent) {
				throw new Error("Expected mock event at index 0");
			}
			const baseAllDayEvent = mockEvents[1];
			if (!baseAllDayEvent) {
				throw new Error("Expected mock event at index 1");
			}

			const dayOneEventA = {
				...baseTimedEvent,
				id: "day1-a",
				startAt: new Date("2024-07-21T09:00:00.000Z"),
			};
			const dayOneEventB = {
				...baseTimedEvent,
				id: "day1-b",
				startAt: new Date("2024-07-21T10:00:00.000Z"),
			};
			const dayOneEventC = {
				...baseTimedEvent,
				id: "day1-c",
				startAt: new Date("2024-07-21T11:00:00.000Z"),
			};
			const dayTwoAllDay = {
				...baseAllDayEvent,
				id: "day2-all-day",
				startDate: "2024-07-22",
				endDate: "2024-07-23",
				allDay: true,
			};

			mockGetUnifiedEventsInDateRange.mockResolvedValue([
				dayTwoAllDay,
				dayOneEventA,
				dayOneEventB,
				dayOneEventC,
			]);

			const result = await eventsPreviewResolver(
				mockOrganization,
				{ perDayLimit: 2 },
				ctx,
				mockResolveInfo,
			);

			const days = result as Array<{
				date: string;
				totalCount: number;
				hasMore: boolean;
				events: Array<{ id: string }>;
			}>;

			expect(days).toHaveLength(2);
			expect(days[0]?.date).toBe("2024-07-21");
			expect(days[1]?.date).toBe("2024-07-22");

			expect(days[0]).toEqual(
				expect.objectContaining({
					totalCount: 3,
					hasMore: true,
				}),
			);
			expect(days[0]?.events).toHaveLength(2);
			expect(days[1]).toEqual(
				expect.objectContaining({
					totalCount: 1,
					hasMore: false,
				}),
			);
			expect(days[1]?.events).toHaveLength(1);
		});

		it("should apply preview defaults and call unified events query with computed limit", async () => {
			vi.useFakeTimers();
			try {
				vi.setSystemTime(new Date("2026-03-22T10:00:00.000Z"));

				mockGetUnifiedEventsInDateRange.mockResolvedValue([]);

				await eventsPreviewResolver(mockOrganization, {}, ctx, mockResolveInfo);

				const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
				if (!callArgs) {
					throw new Error("Expected getUnifiedEventsInDateRange to be called");
				}

				expect(callArgs.includeRecurring).toBe(true);
				expect(callArgs.startDate).toBeInstanceOf(Date);
				expect(callArgs.startDate.getHours()).toBe(0);
				expect(callArgs.startDate.getMinutes()).toBe(0);
				expect(callArgs.startDate.getSeconds()).toBe(0);
				expect(callArgs.startDate.getMilliseconds()).toBe(0);

				const expectedEnd = new Date(callArgs.startDate);
				expectedEnd.setMonth(expectedEnd.getMonth() + 1);
				expectedEnd.setHours(23, 59, 59, 999);
				expect(callArgs.endDate.getTime()).toBe(expectedEnd.getTime());

				const rangeMs = Math.max(
					0,
					callArgs.endDate.getTime() - callArgs.startDate.getTime(),
				);
				const dayCount = Math.max(
					1,
					Math.floor(rangeMs / (24 * 60 * 60 * 1000)) + 1,
				);
				const expectedFetchLimit = Math.min(Math.max(dayCount * 2 * 8, 100), 500);
				expect(callArgs.limit).toBe(expectedFetchLimit);
			} finally {
				vi.useRealTimers();
			}
		});

		it("should skip events with empty dayKey while building preview groups", async () => {
			const baseAllDayEvent = mockEvents[1];
			if (!baseAllDayEvent) {
				throw new Error("Expected mock event at index 1");
			}
			const baseTimedEvent = mockEvents[0];
			if (!baseTimedEvent) {
				throw new Error("Expected mock event at index 0");
			}

			const invalidAllDay = {
				...baseAllDayEvent,
				id: "invalid-all-day-no-start-date",
				allDay: true,
				startDate: null,
				endDate: null,
			};

			const invalidTimed = {
				...baseTimedEvent,
				id: "invalid-timed-no-start-at",
				allDay: false,
				startAt: null,
				endAt: null,
			};

			const validTimed = {
				...baseTimedEvent,
				id: "valid-timed",
				allDay: false,
				startAt: new Date("2024-07-24T09:00:00.000Z"),
				endAt: new Date("2024-07-24T10:00:00.000Z"),
			};

			mockGetUnifiedEventsInDateRange.mockResolvedValue([
				invalidAllDay,
				invalidTimed,
				validTimed,
			]);

			const result = await eventsPreviewResolver(
				mockOrganization,
				{ perDayLimit: 2 },
				ctx,
				mockResolveInfo,
			);

			const days = result as Array<{
				date: string;
				totalCount: number;
				hasMore: boolean;
				events: Array<{ id: string }>;
			}>;

			expect(days).toHaveLength(1);
			expect(days[0]?.date).toBe("2024-07-24");
			expect(days[0]?.totalCount).toBe(1);
			expect(days[0]?.events).toHaveLength(1);
			expect(days[0]?.events[0]?.id).toBe("valid-timed");
		});

		it("should derive dayKey from all-day startDate using toString branch", async () => {
			const baseAllDayEvent = mockEvents[1];
			if (!baseAllDayEvent) {
				throw new Error("Expected mock event at index 1");
			}

			const allDayEvent = {
				...baseAllDayEvent,
				id: "all-day-to-string-branch",
				allDay: true,
				startDate: "2024-08-01",
				endDate: "2024-08-02",
				startAt: null,
				endAt: null,
			};

			mockGetUnifiedEventsInDateRange.mockResolvedValue([allDayEvent]);

			const result = await eventsPreviewResolver(
				mockOrganization,
				{ perDayLimit: 2 },
				ctx,
				mockResolveInfo,
			);

			const days = result as Array<{
				date: string;
				totalCount: number;
				hasMore: boolean;
				events: Array<{ id: string }>;
			}>;

			expect(days).toHaveLength(1);
			expect(days[0]?.date).toBe("2024-08-01");
			expect(days[0]?.events[0]?.id).toBe("all-day-to-string-branch");
		});

		it("should derive dayKey from timed startAt using ISO date slice branch", async () => {
			const baseTimedEvent = mockEvents[0];
			if (!baseTimedEvent) {
				throw new Error("Expected mock event at index 0");
			}

			const timedEvent = {
				...baseTimedEvent,
				id: "timed-iso-slice-branch",
				allDay: false,
				startAt: new Date("2024-08-03T18:45:00.000Z"),
				endAt: new Date("2024-08-03T19:45:00.000Z"),
			};

			mockGetUnifiedEventsInDateRange.mockResolvedValue([timedEvent]);

			const result = await eventsPreviewResolver(
				mockOrganization,
				{ perDayLimit: 2 },
				ctx,
				mockResolveInfo,
			);

			const days = result as Array<{
				date: string;
				totalCount: number;
				hasMore: boolean;
				events: Array<{ id: string }>;
			}>;

			expect(days).toHaveLength(1);
			expect(days[0]?.date).toBe("2024-08-03");
			expect(days[0]?.events[0]?.id).toBe("timed-iso-slice-branch");
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

		it("should handle null values for optional pagination arguments", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "user",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockOrganization.id },
				],
			});
			mockGetUnifiedEventsInDateRange.mockResolvedValue([]);

			await eventsResolver(
				mockOrganization,
				{ first: 10, after: null, before: null, last: null },
				ctx,
				mockResolveInfo,
			);

			// With over-fetching: limit=11 (first:10 + 1), fetchLimit = min(max(11*2, 11+50), 200) = min(max(22, 61), 200) = 61
			expect(mockGetUnifiedEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 61,
				}),
				expect.anything(),
				expect.anything(),
			);
		});
	});

	describe("Default Values and Upcoming Events", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));

			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mockGetUnifiedEventsInDateRange.mockResolvedValue([]);
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should use default values when optional arguments are missing", async () => {
			await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(mockGetUnifiedEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					includeRecurring: true,
				}),
				expect.anything(),
				expect.anything(),
			);

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs) {
				throw new Error("Expected callArgs to be defined");
			}
			const expectedStart = new Date();
			expectedStart.setHours(0, 0, 0, 0);

			// Verify start date is set to start of today (not exact timing check)
			expect(callArgs.startDate).toBeInstanceOf(Date);
			expect(callArgs.startDate.getFullYear()).toBe(
				expectedStart.getFullYear(),
			);
			expect(callArgs.startDate.getMonth()).toBe(expectedStart.getMonth());
			expect(callArgs.startDate.getDate()).toBe(expectedStart.getDate());

			const expectedEnd = new Date();
			expectedEnd.setMonth(expectedEnd.getMonth() + 1);
			expectedEnd.setHours(23, 59, 59, 999);

			// Verify end date is approximately 1 month from now
			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getFullYear()).toBe(expectedEnd.getFullYear());
			expect(callArgs.endDate.getMonth()).toBe(expectedEnd.getMonth());
			expect(callArgs.endDate.getDate()).toBe(expectedEnd.getDate());
		});

		it("should handle upcomingOnly=true", async () => {
			await eventsResolver(
				mockOrganization,
				{ first: 10, upcomingOnly: true },
				ctx,
				mockResolveInfo,
			);

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs) {
				throw new Error("Expected callArgs to be defined");
			}

			// Should use current time as start date
			const expectedStart = new Date("2024-01-01T12:00:00Z");
			expect(callArgs.startDate.getFullYear()).toBe(
				expectedStart.getFullYear(),
			);
			expect(callArgs.startDate.getMonth()).toBe(expectedStart.getMonth());
			expect(callArgs.startDate.getDate()).toBe(expectedStart.getDate());
		});

		it("should handle upcomingOnly=true with explicit endDate", async () => {
			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 2);

			await eventsResolver(
				mockOrganization,
				{ first: 10, upcomingOnly: true, endDate: futureDate },
				ctx,
				mockResolveInfo,
			);

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs) {
				throw new Error("Expected callArgs to be defined");
			}

			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getTime()).toBe(futureDate.getTime());

			// Start date should be recent
			const expectedStart = new Date("2024-01-01T12:00:00Z");
			expect(callArgs.startDate.getFullYear()).toBe(
				expectedStart.getFullYear(),
			);
			expect(callArgs.startDate.getMonth()).toBe(expectedStart.getMonth());
			expect(callArgs.startDate.getDate()).toBe(expectedStart.getDate());
		});

		it("should respect explicit includeRecurring=false", async () => {
			await eventsResolver(
				mockOrganization,
				{ first: 10, includeRecurring: false },
				ctx,
				mockResolveInfo,
			);

			expect(mockGetUnifiedEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					includeRecurring: false,
				}),
				expect.anything(),
				expect.anything(),
			);
		});

		it("should keep default computed future endDate when upcomingOnly=true", async () => {
			await eventsResolver(
				mockOrganization,
				{ first: 10, upcomingOnly: true },
				ctx,
				mockResolveInfo,
			);

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs) {
				throw new Error("Expected callArgs to be defined");
			}

			const expectedEnd = new Date("2024-02-01T23:59:59.999Z");
			expect(callArgs.endDate.getTime()).toBe(expectedEnd.getTime());
		});
	});

	describe("Complexity", () => {
		it("should calculate complexity correctly", () => {
			const organizationType = schema.getType(
				"Organization",
			) as GraphQLObjectType;
			if (!organizationType) {
				throw new Error("Organization type not found");
			}

			const eventsField = organizationType.getFields().events;
			if (!eventsField) {
				throw new Error("Events field not found");
			}

			const complexityFn = eventsField.extensions?.complexity as (args: {
				first?: number | null;
				last?: number | null;
			}) => { field: number; multiplier: number };

			if (!complexityFn) {
				throw new Error("Complexity function not found");
			}

			expect(complexityFn).toBeDefined();
			expect(typeof complexityFn).toBe("function");

			// Test with first
			expect(complexityFn({ first: 10 })).toEqual({
				field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
				multiplier: 10,
			});

			// Test with last
			expect(complexityFn({ last: 5 })).toEqual({
				field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
				multiplier: 5,
			});

			// Test with default
			expect(complexityFn({})).toEqual({
				field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
				multiplier: 1,
			});
		});
	});

	describe("Code Coverage Scenarios", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));

			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should throw error when first is null and last is undefined", async () => {
			await expect(
				eventsResolver(mockOrganization, { first: null }, ctx, mockResolveInfo),
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

		it("should use default date ranges when not provided", async () => {
			mockGetUnifiedEventsInDateRange.mockResolvedValue([]);
			await eventsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs)
				throw new Error("Expected getUnifiedEventsInDateRange to be called");

			const now = new Date();
			now.setHours(0, 0, 0, 0);
			expect(callArgs.startDate.getTime()).toBe(now.getTime());

			const expectedEnd = new Date();
			expectedEnd.setMonth(expectedEnd.getMonth() + 1);
			expectedEnd.setHours(23, 59, 59, 999);

			// Verify end date is approximately 1 month from now
			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getFullYear()).toBe(expectedEnd.getFullYear());
			expect(callArgs.endDate.getMonth()).toBe(expectedEnd.getMonth());
			expect(callArgs.endDate.getDate()).toBe(expectedEnd.getDate());
		});

		it("should handle upcomingOnly: true with default end date logic", async () => {
			mockGetUnifiedEventsInDateRange.mockResolvedValue([]);
			await eventsResolver(
				mockOrganization,
				{ first: 10, upcomingOnly: true },
				ctx,
				mockResolveInfo,
			);

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs)
				throw new Error("Expected getUnifiedEventsInDateRange to be called");

			// effectiveStartDate should be recent
			const expectedStart = new Date();
			expect(callArgs.startDate.getFullYear()).toBe(
				expectedStart.getFullYear(),
			);
			expect(callArgs.startDate.getMonth()).toBe(expectedStart.getMonth());
			expect(callArgs.startDate.getDate()).toBe(expectedStart.getDate());

			// With upcomingOnly, default transformed endDate remains one month from now at end of day.
			const expectedEnd = new Date();
			expectedEnd.setMonth(expectedEnd.getMonth() + 1);
			expectedEnd.setHours(23, 59, 59, 999);
			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getFullYear()).toBe(expectedEnd.getFullYear());
			expect(callArgs.endDate.getMonth()).toBe(expectedEnd.getMonth());
			expect(callArgs.endDate.getDate()).toBe(expectedEnd.getDate());
		});

		it("should respect provided endDate when upcomingOnly is true", async () => {
			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 2);

			mockGetUnifiedEventsInDateRange.mockResolvedValue([]);
			await eventsResolver(
				mockOrganization,
				{ first: 10, upcomingOnly: true, endDate: futureDate },
				ctx,
				mockResolveInfo,
			);

			const callArgs = mockGetUnifiedEventsInDateRange.mock.calls[0]?.[0];
			if (!callArgs)
				throw new Error("Expected getUnifiedEventsInDateRange to be called");

			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getTime()).toBe(futureDate.getTime());
		});

		it("should report error on 'before' when using 'last' with invalid cursor", async () => {
			await expect(
				eventsResolver(
					mockOrganization,
					{ last: 10, before: "invalid-cursor" },
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
								message: "Not a valid cursor.",
							},
						],
					},
				}),
			);
		});
	});

	describe("All-Day Event Cursor Handling", () => {
		beforeEach(() => {
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
		});

		it("should create cursor for all-day event using startDate as UTC midnight", async () => {
			const allDayEvent = {
				id: "event-allday",
				name: "All-Day Event",
				startAt: null,
				endAt: null,
				startDate: "2024-07-20",
				endDate: "2024-07-21",
				allDay: true,
				eventType: "standalone" as const,
				title: "All-Day Event",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "All-day test event",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-allday",
					startAt: new Date("2024-07-20T00:00:00Z").toISOString(),
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([allDayEvent]);
			const result = await eventsResolver(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should match all-day event in pagination when cursor startDate matches event startDate", async () => {
			const allDayEvent1 = {
				id: "event-allday-1",
				name: "All-Day Event 1",
				startAt: null,
				endAt: null,
				startDate: "2024-07-20",
				endDate: "2024-07-21",
				allDay: true,
				eventType: "standalone" as const,
				title: "All-Day Event 1",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "First all-day event",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const allDayEvent2 = {
				id: "event-allday-2",
				name: "All-Day Event 2",
				startAt: null,
				endAt: null,
				startDate: "2024-07-21",
				endDate: "2024-07-22",
				allDay: true,
				eventType: "standalone" as const,
				title: "All-Day Event 2",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "Second all-day event",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-allday-1",
					startAt: new Date("2024-07-20T00:00:00Z").toISOString(),
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([
				allDayEvent1,
				allDayEvent2,
			]);
			const result = await eventsResolver(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should handle all-day event with null startDate by failing cursor match", async () => {
			const invalidAllDayEvent = {
				id: "event-invalid-allday",
				name: "Invalid All-Day Event",
				startAt: null,
				endAt: null,
				startDate: null,
				endDate: null,
				allDay: true,
				eventType: "standalone" as const,
				title: "Invalid All-Day Event",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "Invalid all-day event",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-invalid-allday",
					startAt: "2024-07-20T00:00:00.000Z",
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([invalidAllDayEvent]);
			await expect(
				eventsResolver(
					mockOrganization,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["after"] }],
					},
				}),
			);
		});

		it("should handle timed event with null startAt by failing cursor match", async () => {
			const baseEvent = mockEvents[0];
			if (!baseEvent) {
				throw new Error("Expected mock event at index 0");
			}
			const invalidTimedEvent = {
				...baseEvent,
				startAt: null,
				allDay: false,
			};

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-1",
					startAt: new Date("2024-07-20T10:00:00Z").toISOString(),
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([invalidTimedEvent]);
			await expect(
				eventsResolver(
					mockOrganization,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["after"] }],
					},
				}),
			);
		});

		it("should distinguish all-day events on different dates in cursor comparison", async () => {
			const event1 = {
				id: "event-1",
				name: "Event on July 20",
				startAt: null,
				endAt: null,
				startDate: "2024-07-20",
				endDate: "2024-07-21",
				allDay: true,
				eventType: "standalone" as const,
				title: "Event July 20",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "Event on July 20",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const event2 = {
				id: "event-2",
				name: "Event on July 21",
				startAt: null,
				endAt: null,
				startDate: "2024-07-21",
				endDate: "2024-07-22",
				allDay: true,
				eventType: "standalone" as const,
				title: "Event July 21",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "Event on July 21",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-1",
					startAt: new Date("2024-07-20T00:00:00Z").toISOString(),
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([event1, event2]);
			const result = await eventsResolver(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should backward paginate all-day events using 'last' and 'before' with date matching", async () => {
			const allDayEvent1 = {
				id: "event-allday-1",
				name: "All-Day Event 1",
				startAt: null,
				endAt: null,
				startDate: "2024-07-19",
				endDate: "2024-07-20",
				allDay: true,
				eventType: "standalone" as const,
				title: "All-Day Event 1",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "First all-day event",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const allDayEvent2 = {
				id: "event-allday-2",
				name: "All-Day Event 2",
				startAt: null,
				endAt: null,
				startDate: "2024-07-20",
				endDate: "2024-07-21",
				allDay: true,
				eventType: "standalone" as const,
				title: "All-Day Event 2",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "Second all-day event",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-allday-2",
					startAt: new Date("2024-07-20T00:00:00Z").toISOString(),
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([
				allDayEvent1,
				allDayEvent2,
			]);
			const result = await eventsResolver(
				mockOrganization,
				{ last: 10, before: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should match timed event cursor using timestamp comparison", async () => {
			const baseEvent1 = mockEvents[0];
			if (!baseEvent1) {
				throw new Error("Expected mock event at index 0");
			}
			const baseEvent2 = mockEvents[2];
			if (!baseEvent2) {
				throw new Error("Expected mock event at index 2");
			}

			const timedEvent1 = {
				...baseEvent1,
				startAt: new Date("2024-07-20T10:00:00Z"),
				allDay: false,
			};

			const timedEvent2 = {
				...baseEvent2,
				startAt: new Date("2024-07-20T11:00:00Z"),
				allDay: false,
				startDate: null,
				endDate: null,
			};

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-1",
					startAt: new Date("2024-07-20T10:00:00Z").toISOString(),
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([
				timedEvent1,
				timedEvent2,
			]);
			const result = await eventsResolver(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});

		it("should handle mixed all-day and timed events in pagination", async () => {
			const allDayEvent = {
				id: "event-allday",
				name: "All-Day Event",
				startAt: null,
				endAt: null,
				startDate: "2024-07-20",
				endDate: "2024-07-21",
				allDay: true,
				eventType: "standalone" as const,
				title: "All-Day Event",
				organizationId: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
				createdAt: new Date("2020-01-01T00:00:00Z"),
				creatorId: "user-123",
				description: "All-day event",
				updatedAt: null,
				updaterId: null,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				location: "Test Location",
				registrationClosesAt: new Date("2020-01-01T00:00:00Z"),
				attachments: [],
				isRecurringEventTemplate: false,
			};

			const baseEvent = mockEvents[0];
			if (!baseEvent) {
				throw new Error("Expected mock event at index 0");
			}
			const timedEvent = { ...baseEvent };

			const cursor = Buffer.from(
				JSON.stringify({
					id: "event-allday",
					startAt: new Date("2024-07-20T00:00:00Z").toISOString(),
				}),
			).toString("base64url");

			mockGetUnifiedEventsInDateRange.mockResolvedValue([
				allDayEvent,
				timedEvent,
			]);
			const result = await eventsResolver(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});
	});
});
