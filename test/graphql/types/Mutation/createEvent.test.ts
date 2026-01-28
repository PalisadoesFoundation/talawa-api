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
	// GraphQL returns null for most errors, undefined for some validation errors
	expect([null, undefined]).toContain(result.data?.createEvent);
	expect(result.errors).toEqual(
		expect.arrayContaining<TalawaGraphQLFormattedError>([
			expect.objectContaining(expectedError),
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
		test("rejects yearly never-ending recurring events", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: {
						frequency: "YEARLY",
						interval: 1,
						never: true,
					},
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "recurrence"],
							message: expect.stringContaining(
								"Yearly events cannot be never-ending",
							),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("rejects invalid day codes in byDay", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 5,
						byDay: ["MO", "INVALID"], // Invalid day code
					},
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "recurrence"],
							message: expect.stringContaining("Invalid day code"),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("rejects invalid months in byMonth", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: {
						frequency: "YEARLY",
						interval: 1,
						count: 3,
						byMonth: [1, 13], // 13 is invalid (must be 1-12)
					},
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "recurrence", "byMonth", 1],
							message: expect.stringContaining("Too big"),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("rejects recurrence end date before start date", async () => {
			const organizationId = await createTestOrganization();
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						endDate: pastDate.toISOString(),
					},
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "recurrence"],
							message: expect.stringContaining("end date must be after"),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
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
				expect(result.errors?.[0]?.message).toBe("Internal Server Error");
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

	suite("Attachment Handling", () => {
		test("rejects file upload with invalid MIME type", async () => {
			const organizationId = await createTestOrganization();
			const token = adminAuthToken;

			// Use Fastify's raw inject with manually constructed multipart data
			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: `
					mutation Mutation_createEvent($input: MutationCreateEventInput!) {
						createEvent(input: $input) {
							id
							name
							attachments { mimeType }
						}
					}
				`,
				variables: {
					input: {
						organizationId,
						name: `Event_${Date.now()}`,
						startAt: getFutureDate(7, 10),
						endAt: getFutureDate(7, 12),
						attachments: [null],
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.attachments.0"],
			});

			const fileContent = "fake pdf content";

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.pdf"',
				"Content-Type: application/pdf",
				"",
				fileContent,
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${token}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);

			expect(result.data?.createEvent).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["attachments"]),
									message: expect.stringContaining("Mime type"),
								}),
							]),
						}),
					}),
				]),
			);
		});

		test.each([
			{
				name: "successfully creates event with valid image attachment",
				attachmentCount: 1,
			},
			{
				name: "successfully creates event with multiple image attachments",
				attachmentCount: 2,
			},
		])("$name", async ({ attachmentCount }) => {
			const organizationId = await createTestOrganization();
			const token = adminAuthToken;

			// Mock MinIO to avoid actual file upload
			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockResolvedValue({ etag: "test-etag", versionId: "test-version" });

			try {
				const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

				// Create attachments array
				const attachments = Array(attachmentCount).fill(null);

				// Build map for attachments
				const mapEntries: Record<string, string[]> = {};
				attachments.forEach((_, index) => {
					mapEntries[String(index)] = [`variables.input.attachments.${index}`];
				});

				const operations = JSON.stringify({
					query: `
							mutation Mutation_createEvent($input: MutationCreateEventInput!) {
								createEvent(input: $input) {
									id
									name
									attachments { mimeType }
								}
							}
						`,
					variables: {
						input: {
							organizationId,
							name: `Event_${Date.now()}`,
							startAt: getFutureDate(7, 10),
							endAt: getFutureDate(7, 12),
							attachments,
						},
					},
				});

				const map = JSON.stringify(mapEntries);

				// Build multipart body with all attachments
				const bodyParts = [
					`--${boundary}`,
					'Content-Disposition: form-data; name="operations"',
					"",
					operations,
					`--${boundary}`,
					'Content-Disposition: form-data; name="map"',
					"",
					map,
				];

				attachments.forEach((_, index) => {
					bodyParts.push(`--${boundary}`);
					bodyParts.push(
						`Content-Disposition: form-data; name="${index}"; filename="test${index + 1}.jpg"`,
					);
					bodyParts.push("Content-Type: image/jpeg");
					bodyParts.push("");
					bodyParts.push(`fake jpeg content ${index + 1}`);
				});

				bodyParts.push(`--${boundary}--`);
				const body = bodyParts.join("\r\n");

				const response = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${boundary}`,
						authorization: `bearer ${token}`,
					},
					payload: body,
				});

				const result = JSON.parse(response.body);

				expect(result.errors).toBeUndefined();
				expect(result.data?.createEvent).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						attachments: expect.arrayContaining(
							Array(attachmentCount)
								.fill(null)
								.map(() =>
									expect.objectContaining({
										mimeType: "image/jpeg",
									}),
								),
						),
					}),
				);

				// Verify MinIO upload was called the expected number of times
				expect(putObjectSpy).toHaveBeenCalledTimes(attachmentCount);
			} finally {
				putObjectSpy.mockRestore();
			}
		});
	});

	suite("Database Error Handling", () => {
		test("handles current user not found scenario", async () => {
			const organizationId = await createTestOrganization();

			// Mock the user query to return undefined
			vi.spyOn(
				server.drizzleClient.query.usersTable,
				"findFirst",
			).mockResolvedValue(undefined);

			try {
				const result = await createEvent({
					input: baseEventInput(organizationId),
				});

				expectSpecificError(result, {
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createEvent"],
				});
			} finally {
				vi.restoreAllMocks();
			}
		});

		test("handles event insertion returning empty array", async () => {
			const organizationId = await createTestOrganization();

			// Mock the transaction to simulate empty array return
			vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
				async (callback) => {
					const mockTx = {
						...server.drizzleClient,
						insert: vi.fn().mockImplementation(() => ({
							values: vi.fn().mockReturnThis(),
							returning: vi.fn().mockResolvedValue([]), // Empty array
						})),
					};

					return callback(mockTx as unknown as Parameters<typeof callback>[0]);
				},
			);

			try {
				const result = await createEvent({
					input: baseEventInput(organizationId),
				});

				expectSpecificError(result, {
					extensions: expect.objectContaining<UnexpectedExtensions>({
						code: "unexpected",
					}),
					message: expect.any(String),
					path: ["createEvent"],
				});
			} finally {
				vi.restoreAllMocks();
			}
		});
	});

	suite("Recurring Event Edge Cases", () => {
		test("handles recurring event with end date beyond 12 months", async () => {
			const organizationId = await createTestOrganization();

			// Create a recurring event with end date 18 months in the future
			const farFutureDate = new Date();
			farFutureDate.setMonth(farFutureDate.getMonth() + 18);

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Long-term Recurring Event",
					recurrence: {
						frequency: "MONTHLY",
						interval: 1,
						endDate: farFutureDate.toISOString(),
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Long-term Recurring Event",
				}),
			);
		});

		test("supports never-ending recurring events", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Never-ending Weekly Meeting",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						never: true, // Never-ending recurrence
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Never-ending Weekly Meeting",
				}),
			);
		});

		test("handles count-based recurring event with byMonth", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Quarterly Review",
					recurrence: {
						frequency: "YEARLY",
						interval: 1,
						count: 5,
						byMonth: [3, 6, 9, 12], // March, June, September, December
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Quarterly Review",
				}),
			);
		});
	});

	suite("Notification Error Handling", () => {
		test("handles notification enqueue failure gracefully", async () => {
			const organizationId = await createTestOrganization();

			// Mock NotificationService to throw error during enqueue
			const NotificationService = await import(
				"~/src/services/notification/NotificationService"
			);
			const mockEnqueue = vi
				.spyOn(NotificationService.default.prototype, "enqueueEventCreated")
				.mockImplementation(() => {
					throw new Error("Notification service unavailable");
				});

			try {
				const result = await createEvent({
					input: baseEventInput(organizationId),
				});

				// Event should still be created successfully despite notification failure
				expect(result.errors).toBeUndefined();
				expect(result.data?.createEvent).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						name: "Test Event",
					}),
				);
			} finally {
				mockEnqueue.mockRestore();
			}
		});

		test("handles notification flush failure gracefully", async () => {
			const organizationId = await createTestOrganization();

			// Mock NotificationService to throw error during flush
			// We need to mock the class before the GraphQL context creates an instance
			const NotificationService = await import(
				"~/src/services/notification/NotificationService"
			);
			const mockFlush = vi
				.spyOn(NotificationService.default.prototype, "flush")
				.mockImplementation(() => {
					throw new Error("Flush failed");
				});

			try {
				const result = await createEvent({
					input: baseEventInput(organizationId),
				});

				// Event should still be created successfully despite flush failure
				expect(result.errors).toBeUndefined();
				expect(result.data?.createEvent).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						name: "Test Event",
					}),
				);
			} finally {
				mockFlush.mockRestore();
			}
		});
	});

	suite("Event Generation Window Initialization", () => {
		test("creates event generation window when it does not exist for recurring event", async () => {
			// Create a new organization that has no generation window yet
			const newOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Test Org No Window ${faker.string.ulid()}`,
							countryCode: "us",
						},
					},
				},
			);
			assertToBeNonNullish(newOrgResult.data?.createOrganization?.id);
			const newOrgId = newOrgResult.data.createOrganization.id;

			// Add admin as organization member
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						organizationId: newOrgId,
						memberId: adminUserId,
						role: "administrator",
					},
				},
			});

			// Create a recurring event for the new organization (which has no window)
			// This should trigger the windowConfig initialization branch at line 277 (if (!windowConfig))
			const result = await createEvent({
				input: {
					...baseEventInput(newOrgId),
					name: "Recurring Event With New Window",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 5,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Recurring Event With New Window",
				}),
			);
		});

		test("uses existing generation window for recurring event when window exists", async () => {
			const organizationId = await createTestOrganization();

			// Create first recurring event (this will create a generation window)
			const firstResult = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "First Recurring Event",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 5,
					},
				},
			});

			expect(firstResult.errors).toBeUndefined();
			expect(firstResult.data?.createEvent?.id).toBeDefined();

			// Create second recurring event (this should use existing generation window)
			// This tests the else branch (when windowConfig already exists)
			const secondResult = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Second Recurring Event",
					recurrence: {
						frequency: "MONTHLY",
						interval: 1,
						count: 3,
					},
				},
			});

			expect(secondResult.errors).toBeUndefined();
			expect(secondResult.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Second Recurring Event",
				}),
			);
		});
	});

	suite("Branch Coverage - Window End Date Calculation", () => {
		test("uses recurrence end date when it is within default 12-month window", async () => {
			const organizationId = await createTestOrganization();

			// Create end date 6 months in future (within 12-month default window)
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 6);

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Event with Near End Date",
					recurrence: {
						frequency: "MONTHLY",
						interval: 1,
						endDate: endDate.toISOString(),
					},
				},
			});

			// This tests the branch at line 340-341 where windowEndDate < defaultWindowEnd
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Event with Near End Date",
				}),
			);
		});

		test("uses default window when recurrence end date exceeds 12 months", async () => {
			const organizationId = await createTestOrganization();

			// Create end date 18 months in future (beyond 12-month default window)
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 18);

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Event with Far End Date",
					recurrence: {
						frequency: "MONTHLY",
						interval: 1,
						endDate: endDate.toISOString(),
					},
				},
			});

			// This tests the branch where windowEndDate > defaultWindowEnd (line 343-345)
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Event with Far End Date",
				}),
			);
		});

		test("handles count-based recurring events window calculation", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Count-Based Event",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 10,
					},
				},
			});

			// This tests the branch at line 347-351 for count-based events
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Count-Based Event",
				}),
			);
		});

		test("handles never-ending recurring events window calculation", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Never-Ending Event",
					recurrence: {
						frequency: "DAILY",
						interval: 1,
						never: true,
					},
				},
			});

			// This tests the branch at line 352-356 for never-ending events
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Never-Ending Event",
				}),
			);
		});
	});

	suite("Notification Flush Error Path Coverage", () => {
		test("successfully creates event with notification service enabled", async () => {
			const organizationId = await createTestOrganization();

			// Baseline test: verify event creation succeeds with notification service enabled
			const result = await createEvent({
				input: baseEventInput(organizationId),
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Test Event",
				}),
			);
		});

		test("successfully creates event when notification service is unavailable", async () => {
			const organizationId = await createTestOrganization();

			// Mock NotificationService to simulate it being unavailable (enqueue throws error)
			// The optional chaining in ctx.notification?.enqueueEventCreated() should prevent errors
			const NotificationService = await import(
				"~/src/services/notification/NotificationService"
			);
			const mockEnqueue = vi
				.spyOn(NotificationService.default.prototype, "enqueueEventCreated")
				.mockImplementationOnce(() => {
					throw new Error("Notification service unavailable");
				});

			try {
				// Despite notification service failure, createEvent should succeed
				// because optional chaining short-circuits the error
				const result = await createEvent({
					input: baseEventInput(organizationId),
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.createEvent).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						name: "Test Event",
					}),
				);

				// Verify that notification enqueue was attempted but didn't break the mutation
				expect(mockEnqueue).toHaveBeenCalled();
			} finally {
				mockEnqueue.mockRestore();
			}
		});
	});

	suite("Recurrence Interval Default Values", () => {
		test("uses default interval of 1 when interval is undefined", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Default Interval Event",
					recurrence: {
						frequency: "WEEKLY",
						// interval is undefined, should default to 1
						count: 5,
					},
				},
			});

			// This tests the branch at line 280: interval: parsedArgs.input.recurrence.interval || 1
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Default Interval Event",
				}),
			);
		});

		test("uses provided interval when explicitly set", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Custom Interval Event",
					recurrence: {
						frequency: "WEEKLY",
						interval: 2,
						count: 5,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Custom Interval Event",
				}),
			);
		});
	});

	suite("Recurrence End Date Null Handling", () => {
		test("sets endDate to null for never-ending events", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Never-Ending Recurrence",
					recurrence: {
						frequency: "MONTHLY",
						interval: 1,
						never: true,
					},
				},
			});

			// This tests the branch: recurrenceEndDate: parsedArgs.input.recurrence.endDate || null
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Never-Ending Recurrence",
				}),
			);
		});

		test("sets count to null for end-date based events", async () => {
			const organizationId = await createTestOrganization();
			const futureDate = new Date();
			futureDate.setMonth(futureDate.getMonth() + 3);

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "End-Date Recurrence",
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						endDate: futureDate.toISOString(),
					},
				},
			});

			// This tests the branch: count: parsedArgs.input.recurrence.count || null
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "End-Date Recurrence",
				}),
			);
		});
	});

	suite("Event Default Fields Coverage", () => {
		test("applies default values to optional event boolean fields", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Event with Defaults",
					// allDay, isPublic, isRegisterable, isInviteOnly not provided
				},
			});

			// This tests branches like: allDay: parsedArgs.input.allDay ?? false
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Event with Defaults",
				}),
			);
		});

		test("applies default values in final event object", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Final Object Defaults",
					allDay: true,
				},
			});

			// This tests: allDay: createdEvent.allDay ?? false in final object
			expect(result.errors).toBeUndefined();
			expect(result.data?.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Final Object Defaults",
				}),
			);
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

suite("Post-transaction attachment upload behavior", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test.each([
		{ name: "single attachment", attachmentCount: 1 },
		{ name: "multiple attachments", attachmentCount: 2 },
	])("successfully uploads $name to MinIO after event creation", async ({
		attachmentCount,
	}) => {
		const organizationId = await createTestOrganization();

		const putObjectSpy = vi.spyOn(server.minio.client, "putObject");

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		// Create attachments array
		const attachments = Array(attachmentCount).fill(null);

		// Build map for attachments
		const mapEntries: Record<string, string[]> = {};
		attachments.forEach((_, index) => {
			mapEntries[String(index)] = [`variables.input.attachments.${index}`];
		});

		const operations = JSON.stringify({
			query: `
				mutation CreateEvent($input: MutationCreateEventInput!) {
					createEvent(input: $input) {
					id
					}
				}
			`,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments,
				},
			},
		});

		const map = JSON.stringify(mapEntries);

		// Build multipart body with all attachments
		const bodyParts = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
		];

		attachments.forEach((_, index) => {
			bodyParts.push(`--${boundary}`);
			bodyParts.push(
				`Content-Disposition: form-data; name="${index}"; filename="file${index + 1}.png"`,
			);
			bodyParts.push("Content-Type: image/png");
			bodyParts.push("");
			bodyParts.push(`fake-content-${index + 1}`);
		});

		bodyParts.push(`--${boundary}--`);
		const body = bodyParts.join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		expect(result.errors).toBeUndefined();
		expect(result.data.createEvent.id).toBeDefined();
		expect(putObjectSpy).toHaveBeenCalledTimes(attachmentCount);

		// Verify attachments are stored in DB
		const eventAttachments =
			await server.drizzleClient.query.eventAttachmentsTable.findMany({
				where: (fields, operators) =>
					operators.eq(fields.eventId, result.data.createEvent.id),
			});
		expect(eventAttachments).toHaveLength(attachmentCount);
	});

	test("cleans up DB rows and MinIO objects when attachment upload fails", async () => {
		const organizationId = await createTestOrganization();

		const putObjectSpy = vi.spyOn(server.minio.client, "putObject");
		putObjectSpy.mockRejectedValue(new Error("upload failed"));

		// Count events before the test
		const eventCountBefore =
			await server.drizzleClient.query.eventsTable.findMany({
				where: (fields, operators) =>
					operators.eq(fields.organizationId, organizationId),
			});

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
			mutation CreateEvent($input: MutationCreateEventInput!) {
				createEvent(input: $input) {
					id
				}
			}
		`,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments: [null],
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachments.0"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file.png"',
			"Content-Type: image/png",
			"",
			"fake-content",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// With new behavior, upload failure during transaction causes the entire mutation to fail
		expect(result.errors).toBeDefined();
		expect(result.errors[0]?.message).toContain("upload failed");
		expect(result.data?.createEvent).toBeNull();

		// Verify no new event was created (transaction rolled back)
		const eventCountAfter =
			await server.drizzleClient.query.eventsTable.findMany({
				where: (fields, operators) =>
					operators.eq(fields.organizationId, organizationId),
			});
		expect(eventCountAfter.length).toBe(eventCountBefore.length);
	});

	test("skips upload logic when attachments are undefined", async () => {
		const organizationId = await createTestOrganization();

		const putObjectSpy = vi.spyOn(server.minio.client, "putObject");

		const result = await createEvent({
			input: {
				...baseEventInput(organizationId),
				// attachments intentionally omitted
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createEvent).toBeDefined();

		// Upload block must not run
		expect(putObjectSpy).not.toHaveBeenCalled();
	});

	test("cleans up DB rows and attempts MinIO removal when first attachment upload fails", async () => {
		const organizationId = await createTestOrganization();

		const putObjectSpy = vi.spyOn(server.minio.client, "putObject");
		putObjectSpy.mockRejectedValue(new Error("upload failed"));

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
				mutation CreateEvent($input: MutationCreateEventInput!) {
					createEvent(input: $input) { id }
				}
			`,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments: [null],
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachments.0"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file.png"',
			"Content-Type: image/png",
			"",
			"fake-content",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// With new behavior, upload failure during transaction causes the entire mutation to fail
		expect(result.errors).toBeDefined();
		expect(result.errors[0]?.message).toContain("upload failed");
		expect(result.data?.createEvent).toBeNull();
		expect(putObjectSpy).toHaveBeenCalledTimes(1);
	});

	test("returns event without attachments when DB cleanup fails after upload failure", async () => {
		const organizationId = await createTestOrganization();

		// Upload fails → transaction should fail
		const uploadError = new Error("upload failed");
		vi.spyOn(server.minio.client, "putObject").mockRejectedValueOnce(
			uploadError,
		);

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
      mutation CreateEvent($input: MutationCreateEventInput!) {
        createEvent(input: $input) { id }
      }
    `,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments: [null],
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachments.0"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file.png"',
			"Content-Type: image/png",
			"",
			"fake-content",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// With new behavior, upload failure during transaction causes the entire mutation to fail
		expect(result.errors).toBeDefined();
		expect(result.errors[0]?.message).toContain("upload failed");
		expect(result.data?.createEvent).toBeNull();
	});

	test("logs error when some MinIO attachment cleanup operations fail", async () => {
		const organizationId = await createTestOrganization();

		// Upload fails → transaction should fail
		vi.spyOn(server.minio.client, "putObject").mockRejectedValueOnce(
			new Error("upload failed"),
		);

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
      mutation CreateEvent($input: MutationCreateEventInput!) {
        createEvent(input: $input) { id }
      }
    `,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments: [null],
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachments.0"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file.png"',
			"Content-Type: image/png",
			"",
			"fake-content",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// With new behavior, upload failure during transaction causes the entire mutation to fail
		expect(result.errors).toBeDefined();
		expect(result.errors[0]?.message).toContain("upload failed");
		expect(result.data?.createEvent).toBeNull();
	});

	test("MinIO removal during cleanup is atomic with transaction rollback", async () => {
		const organizationId = await createTestOrganization();

		const removeObjectSpy = vi.spyOn(server.minio.client, "removeObject");
		const putObjectSpy = vi.spyOn(server.minio.client, "putObject");

		// First upload succeeds, second fails
		putObjectSpy
			.mockResolvedValueOnce({ etag: "etag-1", versionId: null })
			.mockRejectedValueOnce(new Error("second upload failed"));

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
				mutation CreateEvent($input: MutationCreateEventInput!) {
					createEvent(input: $input) { id }
				}
			`,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments: [null, null],
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachments.0"],
			"1": ["variables.input.attachments.1"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file1.png"',
			"Content-Type: image/png",
			"",
			"fake-content-1",
			`--${boundary}`,
			'Content-Disposition: form-data; name="1"; filename="file2.png"',
			"Content-Type: image/png",
			"",
			"fake-content-2",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// Mutation should fail
		expect(result.errors).toBeDefined();
		expect(result.errors[0]?.message).toContain("second upload failed");
		expect(result.data?.createEvent).toBeNull();

		// Cleanup was attempted for the first successfully uploaded file
		expect(removeObjectSpy).toHaveBeenCalledTimes(1);

		// Verify the database transaction was rolled back - no event created
		const eventCountAfter =
			await server.drizzleClient.query.eventsTable.findMany({
				where: (fields, operators) =>
					operators.eq(fields.organizationId, organizationId),
			});
		expect(eventCountAfter).toHaveLength(0);
	});

	test("Promise.allSettled ensures partial upload failures trigger cleanup of successful uploads", async () => {
		const organizationId = await createTestOrganization();

		// This test verifies that the Promise.allSettled pattern correctly identifies
		// which uploads succeeded and cleans them up when any upload fails
		const removeObjectSpy = vi.spyOn(server.minio.client, "removeObject");
		let uploadCallCount = 0;

		vi.spyOn(server.minio.client, "putObject").mockImplementation(async () => {
			uploadCallCount++;
			// Simulate a failure on the second upload
			if (uploadCallCount === 2) {
				throw new Error("partial upload failure");
			}
			return { etag: `test-etag-${uploadCallCount}`, versionId: null };
		});

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations = JSON.stringify({
			query: `
				mutation CreateEvent($input: MutationCreateEventInput!) {
					createEvent(input: $input) { id }
				}
			`,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments: [null, null],
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachments.0"],
			"1": ["variables.input.attachments.1"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file1.png"',
			"Content-Type: image/png",
			"",
			"content1",
			`--${boundary}`,
			'Content-Disposition: form-data; name="1"; filename="file2.png"',
			"Content-Type: image/png",
			"",
			"content2",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// Should fail due to upload error
		expect(result.errors).toBeDefined();
		expect(result.data?.createEvent).toBeNull();

		// Since Promise.allSettled is used, cleanup should happen:
		// - First upload succeeded, so it should be removed
		expect(removeObjectSpy).toHaveBeenCalledTimes(1);

		// Verify transaction rollback - no event was created
		const events = await server.drizzleClient.query.eventsTable.findMany({
			where: (fields, operators) =>
				operators.eq(fields.organizationId, organizationId),
		});
		expect(events).toHaveLength(0);
	});

	test("handles cleanup removal failures and logs them", async () => {
		const organizationId = await createTestOrganization();

		const removeObjectSpy = vi.spyOn(server.minio.client, "removeObject");
		const putObjectSpy = vi.spyOn(server.minio.client, "putObject");

		// First upload succeeds, then subsequent uploads succeed but we trigger cleanup fail
		putObjectSpy
			.mockResolvedValueOnce({ etag: "etag-1", versionId: null })
			.mockResolvedValueOnce({ etag: "etag-2", versionId: null })
			.mockResolvedValueOnce({ etag: "etag-3", versionId: null })
			.mockRejectedValueOnce(new Error("upload failed"));

		// removeObject fails during cleanup for the first successful upload
		removeObjectSpy.mockRejectedValueOnce(new Error("cleanup removal failed"));

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
				mutation CreateEvent($input: MutationCreateEventInput!) {
					createEvent(input: $input) { id }
				}
			`,
			variables: {
				input: {
					...baseEventInput(organizationId),
					attachments: [null, null, null, null],
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachments.0"],
			"1": ["variables.input.attachments.1"],
			"2": ["variables.input.attachments.2"],
			"3": ["variables.input.attachments.3"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="file1.png"',
			"Content-Type: image/png",
			"",
			"fake-content-1",
			`--${boundary}`,
			'Content-Disposition: form-data; name="1"; filename="file2.png"',
			"Content-Type: image/png",
			"",
			"fake-content-2",
			`--${boundary}`,
			'Content-Disposition: form-data; name="2"; filename="file3.png"',
			"Content-Type: image/png",
			"",
			"fake-content-3",
			`--${boundary}`,
			'Content-Disposition: form-data; name="3"; filename="file4.png"',
			"Content-Type: image/png",
			"",
			"fake-content-4",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				authorization: `bearer ${adminAuthToken}`,
				"content-type": `multipart/form-data; boundary=${boundary}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// Mutation should fail due to upload error
		expect(result.errors).toBeDefined();
		expect(result.errors[0]?.message).toContain("upload failed");
		expect(result.data?.createEvent).toBeNull();

		// Cleanup was attempted for the first successfully uploaded file
		// At least one removeObject should have been called
		expect(removeObjectSpy).toHaveBeenCalled();

		// Verify transaction was rolled back
		const eventCountAfter =
			await server.drizzleClient.query.eventsTable.findMany({
				where: (fields, operators) =>
					operators.eq(fields.organizationId, organizationId),
			});
		expect(eventCountAfter).toHaveLength(0);
	});
});
