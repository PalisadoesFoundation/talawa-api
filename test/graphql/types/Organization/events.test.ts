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
			isInviteOnly: false,
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
			isInviteOnly: false,
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
				createdAt: new Date(),
				creatorId: "user-123",
				description: "description",
				updatedAt: null,
				updaterId: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
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
					isInviteOnly: false,
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

			// When upcomingOnly is true, it currently overrides the explicit endDate
			// and sets a default 1-year window.
			const expectedEndDate = new Date();
			expectedEndDate.setFullYear(expectedEndDate.getFullYear() + 1);

			// Verify end date is set to approximately 1 year from now
			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getFullYear()).toBe(
				expectedEndDate.getFullYear(),
			);
			expect(callArgs.endDate.getMonth()).toBe(expectedEndDate.getMonth());
			expect(callArgs.endDate.getDate()).toBe(expectedEndDate.getDate());

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

		it("should use pre-calculated end date when it's in the future", async () => {
			vi.useFakeTimers();
			const t1 = new Date("2025-01-01T12:00:00Z");
			vi.setSystemTime(t1);

			// Mock findFirst to rewind time. This simulates a scenario where
			// dateRange.end (calculated earlier based on t1) is in the future relative to the
			// time when the check runs (rewound time), ensuring the else block is covered.
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				async (..._args: unknown[]) => {
					vi.setSystemTime(new Date("2025-01-01T11:00:00Z")); // Rewind 1 hour
					return {
						id: "user-123",
						role: "member",
						organizationMembershipsWhereMember: [
							{ role: "member", organizationId: mockOrganization.id },
						],
					};
				},
			);

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

			// Should use the T1 date as end date because we hit the else block
			expect(callArgs.endDate).toEqual(t1);

			vi.useRealTimers();
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

			// effectiveEndDate should be 1 year from now
			const expectedEnd = new Date();
			expectedEnd.setFullYear(expectedEnd.getFullYear() + 1);
			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getFullYear()).toBe(expectedEnd.getFullYear());
			expect(callArgs.endDate.getMonth()).toBe(expectedEnd.getMonth());
			expect(callArgs.endDate.getDate()).toBe(expectedEnd.getDate());
		});

		it("should ignore provided endDate when upcomingOnly is true", async () => {
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

			// Should be default 1 year from now, ignoring the 2 year future date
			const expectedEnd = new Date();
			expectedEnd.setFullYear(expectedEnd.getFullYear() + 1);
			expect(callArgs.endDate).toBeInstanceOf(Date);
			expect(callArgs.endDate.getFullYear()).toBe(expectedEnd.getFullYear());
			expect(callArgs.endDate.getMonth()).toBe(expectedEnd.getMonth());
			expect(callArgs.endDate.getDate()).toBe(expectedEnd.getDate());
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
});
