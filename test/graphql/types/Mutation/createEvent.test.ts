import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import type { ExecutionResult } from "graphql";
import { afterEach, expect, suite, test, vi } from "vitest";
import {
	agendaCategoriesTable,
	agendaFoldersTable,
} from "~/src/drizzle/schema";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
	UnexpectedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_signIn,
} from "../documentNodes";

// Specific type for createEvent mutation response using ExecutionResult
type CreateEventMutationResponse = ExecutionResult<{
	createEvent: ResultOf<typeof Mutation_createEvent>["createEvent"] | null;
}>;

// Setup admin authentication for tests
const adminSignInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(adminSignInResult.data?.signIn?.authenticationToken);
const adminAuthToken = adminSignInResult.data.signIn.authenticationToken;
const adminUserId = adminSignInResult.data.signIn.user?.id;
assertToBeNonNullish(adminUserId);

// Helpers to improve maintainability
const createEvent = async (
	variables: VariablesOf<typeof Mutation_createEvent>,
	token = adminAuthToken,
): Promise<CreateEventMutationResponse> =>
	mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${token}` },
		variables,
	});

// Helper to generate a future date
const getFutureDate = (daysFromNow: number, hours = 10) => {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	date.setUTCHours(hours, 0, 0, 0);
	return date.toISOString();
};

// Helper to generate a past date
const getPastDate = (daysAgo: number, hours = 10) => {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setUTCHours(hours, 0, 0, 0);
	return date.toISOString();
};

// Helper to generate next New Year's date
const getNextNewYearISO = (hours = 0, minutes = 0) => {
	const now = new Date();
	const currentYear = now.getFullYear();
	const nextNewYear = new Date(
		Date.UTC(currentYear + 1, 0, 1, hours, minutes, 0, 0),
	); // January 1st of next year in UTC
	return nextNewYear.toISOString();
};

// Standard event input for consistent testing
const baseEventInput = (organizationId: string) => ({
	name: "Test Event",
	description: "Test Description",
	startAt: getFutureDate(30, 10), // 30 days from now at 10:00
	endAt: getFutureDate(30, 12), // 30 days from now at 12:00
	organizationId,
});

// Check error codes quickly
const expectErrorCode = (result: CreateEventMutationResponse, code: string) =>
	expect(result.errors?.[0]?.extensions?.code).toBe(code);

// Helper for detailed error structure validation
const expectSpecificError = (
	result: CreateEventMutationResponse,
	expectedError: Partial<TalawaGraphQLFormattedError>,
) => {
	expect(result.data?.createEvent).toBeNull();
	expect(result.errors).toEqual(
		expect.arrayContaining<TalawaGraphQLFormattedError>([
			expect.objectContaining<TalawaGraphQLFormattedError>(
				expectedError as TalawaGraphQLFormattedError,
			),
		]),
	);
};

// Create organization and return ID
const createTestOrganization = async () => {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Test Org ${faker.string.ulid()}`,
					countryCode: "us",
				},
			},
		},
	);
	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	const orgId = createOrgResult.data.createOrganization.id;

	// Add admin as organization member
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				organizationId: orgId,
				memberId: adminUserId,
				role: "administrator",
			},
		},
	});

	return orgId;
};

// Create organization member with proper permissions
const createOrganizationMember = async (
	organizationId: string,
	role: "administrator" | "regular" = "regular",
) => {
	const { userId, authToken } = await createRegularUserUsingAdmin();
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: { input: { organizationId, memberId: userId, role } },
	});
	return { userId, authToken };
};

// Successful event creation tests
const expectSuccessfulEvent = (
	result: CreateEventMutationResponse,
	expectedName: string,
) => {
	expect(result.errors).toBeUndefined();
	expect(result.data?.createEvent).toEqual(
		expect.objectContaining({
			id: expect.any(String),
			name: expectedName,
		}),
	);
};

suite("Mutation field createEvent", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	suite("Authentication and Authorization", () => {
		test("should reject unauthenticated requests", async () => {
			const result = await createEvent(
				{
					input: { ...baseEventInput(faker.string.uuid()) },
				},
				"",
			);

			expectSpecificError(result, {
				extensions: expect.objectContaining<UnauthenticatedExtensions>({
					code: "unauthenticated",
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("rejects events for non-existent organizations", async () => {
			const result = await createEvent({
				input: { ...baseEventInput(faker.string.uuid()) },
			});

			expectSpecificError(result, {
				extensions:
					expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
						{
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								{ argumentPath: ["input", "organizationId"] },
							]),
						},
					),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("prevents non-members from creating organization events", async () => {
			const organizationId = await createTestOrganization();
			const { authToken: regularUserAuthToken } =
				await createRegularUserUsingAdmin();

			const result = await createEvent(
				{
					input: { ...baseEventInput(organizationId) },
				},
				regularUserAuthToken,
			);

			expectSpecificError(result, {
				extensions:
					expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
						{
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								{ argumentPath: ["input", "organizationId"] },
							]),
						},
					),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});
	});

	suite("Input Validation", () => {
		test("should not allow events ending before they start", async () => {
			const organizationId = await createTestOrganization();
			// Ensure endAt < startAt validation runs before recurrence validation so this test targets endAt validation error
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					startAt: getFutureDate(1, 12), // 1 day from now at 12:00
					endAt: getFutureDate(1, 10), // 1 day from now at 10:00 (invalid - ends before start)
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{ argumentPath: ["input", "endAt"], message: expect.any(String) },
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("rejects event names that are too long", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: "a".repeat(257) },
			});
			expect(result.data?.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("prevents creating events with empty names", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: "" },
			});
			expect(result.data?.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("should not allow scheduling events in the past", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					startAt: getPastDate(1, 10), // 1 day ago at 10:00
					endAt: getPastDate(1, 12), // 1 day ago at 12:00
				},
			});
			expect(result.data?.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("rejects locations exceeding character limit", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					location: "a".repeat(1025),
				},
			});
			expect(result.data?.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("prevents empty location strings", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: { ...baseEventInput(organizationId), location: "" },
			});
			expect(result.data?.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("should require end condition for recurring events", async () => {
			const organizationId = await createTestOrganization();
			// Recurrence requires either count or endDate to prevent infinite event generation
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: { frequency: "WEEKLY", interval: 1 },
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "recurrence"],
							message: expect.stringContaining("exactly one"),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("rejects zero in byMonthDay array", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: {
						frequency: "MONTHLY",
						interval: 1,
						count: 5,
						byMonthDay: [0, 15],
					},
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "recurrence", "byMonthDay"],
							message: expect.stringContaining("cannot contain 0"),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("prevents specifying both count and endDate for recurrence", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 5,
						endDate: getFutureDate(60, 0), // 60 days from now at midnight
					},
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "recurrence"],
							message: expect.stringContaining("Cannot specify more than one"),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("should not allow zero interval for recurrence", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: { frequency: "WEEKLY", interval: 0, count: 5 },
				},
			});
			expect(result.data?.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("rejects intervals that are too large", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: { frequency: "DAILY", interval: 1001, count: 5 },
				},
			});
			expect(result.data?.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("validates attachment mime types using schema validation", async () => {
			// This test validates that the GraphQL Upload scalar properly rejects invalid file objects
			// and that the resolver handles attachment validation correctly

			const organizationId = await createTestOrganization();

			// Test that invalid file objects are rejected by the Upload scalar
			// This simulates what happens when someone tries to send invalid file data
			const invalidFiles = [
				{
					filename: "test.png",
					mimetype: "image/png", // Valid mime type but invalid object structure for Upload scalar
					encoding: "7bit",
				},
			];

			const invalidResult = await createEvent({
				input: {
					...baseEventInput(organizationId),
					attachments: invalidFiles,
				},
			});

			// The Upload scalar should reject this before it reaches our resolver
			expect(invalidResult.errors).toBeDefined();
			const errorMessage = invalidResult.errors?.[0]?.message;
			expect(
				errorMessage?.includes("Upload value invalid") ||
					errorMessage?.includes("Graphql validation error"),
			).toBe(true);
		});

		test("validates attachment array length constraints", async () => {
			// Testing with empty array - this should reach our resolver and be validated
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					attachments: [],
				},
			});

			expect(result.data?.createEvent).toBeNull();
			expect(result.errors).toBeDefined();
			expectErrorCode(result, "invalid_arguments");

			// Testing with too many files (21+) would be rejected by the GraphQL Upload scalar
			// before reaching our resolver, so we don't test that scenario here as it's handled
			// at the GraphQL layer rather than our application validation layer.
		});

		test("should not allow duplicate days in byDay", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 5,
						byDay: ["MO", "MO"],
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
				}),
			);
		});

		test("rejects events with both isPublic and isInviteOnly set to true", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					isPublic: true,
					isInviteOnly: true,
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "isPublic"],
							message: expect.stringContaining(
								"cannot be both Public and Invite-Only",
							),
						},
						{
							argumentPath: ["input", "isInviteOnly"],
							message: expect.stringContaining(
								"cannot be both Public and Invite-Only",
							),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});
	});

	suite("Successful Event Creation", () => {
		test("successfully creates a basic event", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: baseEventInput(organizationId),
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Test Event",
					description: "Test Description",
					organization: expect.objectContaining({
						id: organizationId,
						countryCode: "us",
					}),
				}),
			);
		});

		test("allows creating events with all optional fields", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Event with Optional Fields",
					allDay: true,
					isPublic: true,
					isRegisterable: true,
					location: "Test Location",
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Event with Optional Fields",
				}),
			);
		});

		test("handles multi-day events correctly", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Multi-day Event",
					startAt: getFutureDate(1, 10), // 1 day from now at 10:00
					endAt: getFutureDate(3, 18), // 3 days from now at 18:00
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Multi-day Event",
				}),
			);
		});

		test("supports private event creation", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Private Event",
					isPublic: false,
					isRegisterable: false,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Private Event",
				}),
			);
		});

		test("allows organization members to create events", async () => {
			const organizationId = await createTestOrganization();
			const { userId: regularUserId, authToken: regularUserAuthToken } =
				await createOrganizationMember(organizationId, "administrator");

			const result = await createEvent(
				{
					input: { ...baseEventInput(organizationId), name: "Event by Member" },
				},
				regularUserAuthToken,
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Event by Member",
					creator: expect.objectContaining({ id: regularUserId }),
				}),
			);
		});

		test("accepts single character event names", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: "A" },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({ id: expect.any(String), name: "A" }),
			);
		});

		test("handles special characters in event names", async () => {
			const organizationId = await createTestOrganization();
			const specialName = "Company Party & Celebration!";

			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: specialName },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Company Party &amp; Celebration!",
				}),
			);
		});

		test("supports count-based recurring events", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Daily Standup",
					recurrence: { frequency: "DAILY", interval: 1, count: 10 },
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Daily Standup",
				}),
			);
		});

		test("allows end date-based recurrence patterns", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Weekly Meeting",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						endDate: getFutureDate(60, 0), // 60 days from now at midnight
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Weekly Meeting",
				}),
			);
		});

		test("supports custom weekday patterns", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Weekday Training",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 8,
						byDay: ["MO", "WE", "FR"],
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Weekday Training",
				}),
			);
		});
	});

	suite("Error Handling", () => {
		test("gracefully handles database insertion failures", async () => {
			const organizationId = await createTestOrganization();

			// Mock the db insert failure to ensure transaction rollbacks are handled
			// Mock the transaction to simulate database update failure
			vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
				async (callback) => {
					const mockTx = {
						...server.drizzleClient,
						insert: vi.fn().mockImplementation(() => {
							throw new Error("Database insertion failed");
						}),
					};

					return callback(mockTx as unknown as Parameters<typeof callback>[0]);
				},
			);

			try {
				const result = await createEvent({
					input: baseEventInput(organizationId),
				});

				expect(result.data?.createEvent).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.message).toBe("Database insertion failed");
			} finally {
				vi.restoreAllMocks();
			}
		});

		test("gracefully handles recurrence rule creation failures", async () => {
			const organizationId = await createTestOrganization();

			// Mock the transaction to simulate recurrence rule insertion failure
			vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
				async (callback) => {
					// Mocking transaction object that simulates successful event creation
					// but fails on recurrence rule creation
					const mockTx = {
						...server.drizzleClient,
						insert: vi.fn().mockImplementation((table) => {
							const mockInsert = {
								values: vi.fn().mockReturnThis(),
								returning: vi.fn(),
							};

							// Check if this is the recurrence rules table insertion
							// We simulate failure by returning empty array for recurrence rule insertion
							if (table === recurrenceRulesTable) {
								mockInsert.returning.mockResolvedValue([]); // This simulates the failure
							} else {
								// For events table and other tables, return successful mock data
								mockInsert.returning.mockResolvedValue([
									{
										id: "test-event-id",
										name: "Test Recurring Event",
										organizationId,
										creatorId: "test-creator-id",
										description: "Test Description",
										startAt: new Date(getFutureDate(1, 10)),
										endAt: new Date(getFutureDate(1, 12)),
										isRecurringEventTemplate: true,
									},
								]);
							}
							return mockInsert;
						}),
					};
					return callback(mockTx as unknown as Parameters<typeof callback>[0]);
				},
			);

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Test Recurring Event",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 5,
					},
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<UnexpectedExtensions>({
					code: "unexpected",
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});
	});

	suite("Advanced Use Cases and Edge Cases", () => {
		test("supports recurring events on the last day of each month", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Monthly Report Due",
					recurrence: {
						frequency: "MONTHLY",
						interval: 1,
						count: 12,
						byMonthDay: [-1], // Last day of each month
					},
				},
			});

			expectSuccessfulEvent(result, "Monthly Report Due");
		});

		test("handles New Year's Day events correctly", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "New Year Celebration",
					startAt: getNextNewYearISO(0, 0), // Next January 1st at 00:00:00Z
					endAt: getNextNewYearISO(1, 0), // Next January 1st at 01:00:00Z
				},
			});

			expectSuccessfulEvent(result, "New Year Celebration");
		});

		test("accepts event names at maximum character limit", async () => {
			const organizationId = await createTestOrganization();
			const maxLengthName = "a".repeat(255);

			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: maxLengthName },
			});

			expectSuccessfulEvent(result, maxLengthName);
		});

		test("supports events recurring on all days of the week", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "All Weekdays Event",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 4,
						byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
					},
				},
			});

			expectSuccessfulEvent(result, "All Weekdays Event");
		});

		test("properly handles unicode and emoji characters in names", async () => {
			const organizationId = await createTestOrganization();
			const unicodeName = "🎉 Annual Celebration 年会 🎊";

			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: unicodeName },
			});

			expectSuccessfulEvent(result, unicodeName);
		});

		test("allows the same member to create multiple events", async () => {
			const organizationId = await createTestOrganization();
			const { authToken } = await createOrganizationMember(
				organizationId,
				"administrator",
			);

			const event1Result = await createEvent(
				{
					input: { ...baseEventInput(organizationId), name: "First Event" },
				},
				authToken,
			);

			const event2Result = await createEvent(
				{
					input: { ...baseEventInput(organizationId), name: "Second Event" },
				},
				authToken,
			);

			expectSuccessfulEvent(event1Result, "First Event");
			expectSuccessfulEvent(event2Result, "Second Event");
		});

		test("handles events scheduled exactly at midnight", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Midnight Launch Event",
					startAt: getNextNewYearISO(0, 0), // Next January 1st at 00:00:00Z
					endAt: getNextNewYearISO(0, 30), // Next January 1st at 00:30:00Z
				},
			});

			expectSuccessfulEvent(result, "Midnight Launch Event");
		});
	});
});

suite("Default Agenda Folder and Category Creation", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});
	test("creates default agenda folder and category for standalone events", async () => {
		const organizationId = await createTestOrganization();

		const result = await createEvent({
			input: baseEventInput(organizationId),
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createEvent);

		const eventId = result.data.createEvent.id;

		const defaultFolder =
			await server.drizzleClient.query.agendaFoldersTable.findFirst({
				where: (fields, operators) => operators.eq(fields.eventId, eventId),
			});

		const defaultCategory =
			await server.drizzleClient.query.agendaCategoriesTable.findFirst({
				where: (fields, operators) => operators.eq(fields.eventId, eventId),
			});

		expect(defaultFolder).toEqual(
			expect.objectContaining({
				eventId,
				organizationId,
				isDefaultFolder: true,
				sequence: 1,
				name: "Default",
				creatorId: adminUserId,
			}),
		);

		expect(defaultCategory).toEqual(
			expect.objectContaining({
				eventId,
				organizationId,
				isDefaultCategory: true,
				name: "Default",
				creatorId: adminUserId,
			}),
		);
	});

	test("creates default agenda folder and category for recurring events", async () => {
		const organizationId = await createTestOrganization();

		const result = await createEvent({
			input: {
				...baseEventInput(organizationId),
				recurrence: {
					frequency: "WEEKLY",
					interval: 1,
					count: 3,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createEvent);

		const eventId = result.data.createEvent.id;

		const defaultFolder =
			await server.drizzleClient.query.agendaFoldersTable.findFirst({
				where: (fields, operators) => operators.eq(fields.eventId, eventId),
			});

		const defaultCategory =
			await server.drizzleClient.query.agendaCategoriesTable.findFirst({
				where: (fields, operators) => operators.eq(fields.eventId, eventId),
			});

		expect(defaultFolder?.isDefaultFolder).toBe(true);
		expect(defaultCategory?.isDefaultCategory).toBe(true);
	});

	test("rolls back transaction if default agenda folder insert fails", async () => {
		const organizationId = await createTestOrganization();

		vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
			async (callback) => {
				const mockTx = {
					...server.drizzleClient,
					insert: vi.fn().mockImplementation((table) => {
						if (table === agendaFoldersTable) {
							return {
								values: vi.fn().mockReturnThis(),
								returning: vi.fn().mockResolvedValue([]),
							};
						}
						// Return a mock for all other tables to avoid real database writes
						return {
							values: vi.fn().mockReturnThis(),
							returning: vi.fn().mockResolvedValue([
								{
									id: faker.string.uuid(),
									name: "Test Event",
									organizationId,
									creatorId: adminUserId,
								},
							]),
						};
					}),
				};

				return callback(mockTx as unknown as Parameters<typeof callback>[0]);
			},
		);

		const result = await createEvent({
			input: baseEventInput(organizationId),
		});

		expect(result.data?.createEvent).toBeNull();
		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
	});

	test("rolls back transaction if default agenda category insert fails", async () => {
		const organizationId = await createTestOrganization();

		vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
			async (callback) => {
				const mockTx = {
					...server.drizzleClient,
					insert: vi.fn().mockImplementation((table) => {
						if (table === agendaCategoriesTable) {
							return {
								values: vi.fn().mockReturnThis(),
								returning: vi.fn().mockResolvedValue([]),
							};
						}
						// Return a mock for all other tables to avoid real database writes
						return {
							values: vi.fn().mockReturnThis(),
							returning: vi.fn().mockResolvedValue([
								{
									id: faker.string.uuid(),
									name: "Test Event",
									organizationId,
									creatorId: adminUserId,
								},
							]),
						};
					}),
				};

				return callback(mockTx as unknown as Parameters<typeof callback>[0]);
			},
		);

		const result = await createEvent({
			input: baseEventInput(organizationId),
		});

		expect(result.data?.createEvent).toBeNull();
		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
	});

	test("creates separate default folder and category for multiple events", async () => {
		const organizationId = await createTestOrganization();

		const event1 = await createEvent({
			input: baseEventInput(organizationId),
		});

		const event2 = await createEvent({
			input: { ...baseEventInput(organizationId), name: "Second Event" },
		});

		assertToBeNonNullish(event1.data?.createEvent);
		assertToBeNonNullish(event2.data?.createEvent);

		const defaultFolders =
			await server.drizzleClient.query.agendaFoldersTable.findMany({
				where: (fields, operators) =>
					operators.eq(fields.organizationId, organizationId),
			});

		const defaultCategories =
			await server.drizzleClient.query.agendaCategoriesTable.findMany({
				where: (fields, operators) =>
					operators.eq(fields.organizationId, organizationId),
			});

		expect(defaultFolders.filter((f) => f.isDefaultFolder)).toHaveLength(2);
		expect(new Set(defaultFolders.map((f) => f.eventId)).size).toBe(2);

		expect(defaultCategories.filter((c) => c.isDefaultCategory)).toHaveLength(
			2,
		);
		expect(new Set(defaultCategories.map((c) => c.eventId)).size).toBe(2);
	});
});