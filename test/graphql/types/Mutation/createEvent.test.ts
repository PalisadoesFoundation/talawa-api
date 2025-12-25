import { faker } from "@faker-js/faker";
import type { VariablesOf } from "gql.tada";
import { expect, suite, test, vi } from "vitest";
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

// Helpers to improve maintainability
const createEvent = async (
	variables: VariablesOf<typeof Mutation_createEvent>,
	token = adminAuthToken,
) =>
	mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${token}` },
		variables,
	});

// Standard event input for consistent testing
const baseEventInput = (organizationId: string) => ({
	name: "Test Event",
	description: "Test Description",
	startAt: new Date("2025-01-01T10:00:00Z"),
	endAt: new Date("2025-01-01T12:00:00Z"),
	organizationId,
});

// Check error codes quickly
const expectErrorCode = (result: any, code: string) =>
	expect(result.errors?.[0]?.extensions?.code).toBe(code);

// Helper for detailed error structure validation
const expectSpecificError = (result: any, expectedError: {
	extensions: any;
	message: any;
	path: string[];
}) => {
	expect(result.data.createEvent).toEqual(null);
	expect(result.errors).toEqual(
		expect.arrayContaining<TalawaGraphQLFormattedError>([
			expect.objectContaining<TalawaGraphQLFormattedError>(expectedError),
		]),
	);
};

// Create organization and return ID
const createTestOrganization = async () => {
	const createOrgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Test Org ${faker.string.ulid()}`,
				countryCode: "US",
			},
		},
	});
	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	return createOrgResult.data.createOrganization.id;
};

// Create organization member with proper permissions
const createOrganizationMember = async (organizationId: string) => {
	const { userId, authToken } = await createRegularUserUsingAdmin();
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: { input: { organizationId, userId } },
	});
	return { userId, authToken };
};

// Successful event creation tests
const expectSuccessfulEvent = (result: any, expectedName: string) => {
	expect(result.errors).toBeUndefined();
	expect(result.data.createEvent).toEqual(
		expect.objectContaining({
			id: expect.any(String),
			name: expectedName,
		}),
	);
};

suite("Mutation field createEvent", () => {
	suite("Authentication and Authorization", () => {
		test("should reject unauthenticated requests", async () => {
			const result = await createEvent({
				input: { ...baseEventInput(faker.string.uuid()) },
			}, "");

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
				extensions: expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>({
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						{ argumentPath: ["input", "organizationId"] },
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("prevents non-members from creating organization events", async () => {
			const organizationId = await createTestOrganization();
			const { authToken: regularUserAuthToken } = await createRegularUserUsingAdmin();

			const result = await createEvent({
				input: { ...baseEventInput(organizationId) },
			}, regularUserAuthToken);

			expectSpecificError(result, {
				extensions: expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>({
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: expect.arrayContaining([
						{ argumentPath: ["input", "organizationId"] },
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});
	});

	suite("Input Validation", () => {
		test("should not allow events ending before they start", async () => {
			const organizationId = await createTestOrganization();

			// Test fails when recurrence validation ran first
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					startAt: new Date("2025-01-01T12:00:00Z"),
					endAt: new Date("2025-01-01T10:00:00Z"),
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
				input: { ...baseEventInput(organizationId), name: "a".repeat(256) },
			});
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("prevents creating events with empty names", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: "" },
			});
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("should not allow scheduling events in the past", async () => {
			const organizationId = await createTestOrganization();
			// If someone creates an event for yesterday by mistake
			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					startAt: new Date("2020-01-01T10:00:00Z"),
					endAt: new Date("2020-01-01T12:00:00Z"),
				},
			});
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("rejects locations exceeding character limit", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: { ...baseEventInput(organizationId), location: "a".repeat(1025) },
			});
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("prevents empty location strings", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: { ...baseEventInput(organizationId), location: "" },
			});
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("should require end condition for recurring events", async () => {
			const organizationId = await createTestOrganization();
			// Without count or endDate, this would create infinite events
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
						endDate: new Date("2025-03-01T00:00:00Z"),
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
			expect(result.data.createEvent).toEqual(null);
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
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("prevents uploading files with unsupported formats", async () => {
			const organizationId = await createTestOrganization();
			const mockFileUpload = {
				filename: "test.txt",
				mimetype: "invalid/mimetype",
				encoding: "7bit",
				createReadStream: vi.fn(),
			};

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					attachments: [Promise.resolve(mockFileUpload)],
				},
			});

			expectSpecificError(result, {
				extensions: expect.objectContaining<InvalidArgumentsExtensions>({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						{
							argumentPath: ["input", "attachments", 0],
							message: expect.stringContaining("not allowed"),
						},
					]),
				}),
				message: expect.any(String),
				path: ["createEvent"],
			});
		});

		test("should not accept empty attachment arrays", async () => {
			const organizationId = await createTestOrganization();
			const result = await createEvent({
				input: { ...baseEventInput(organizationId), attachments: [] },
			});
			expect(result.data.createEvent).toEqual(null);
			expect(result.errors).toBeDefined();
		});

		test("rejects uploading too many files at once", async () => {
			const organizationId = await createTestOrganization();
			const mockFileUploads = Array.from({ length: 21 }, (_, i) => 
				Promise.resolve({
					filename: `test${i}.png`,
					mimetype: "image/png",
					encoding: "7bit",
					createReadStream: vi.fn(),
				})
			);

			const result = await createEvent({
				input: { ...baseEventInput(organizationId), attachments: mockFileUploads },
			});
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});

		test("prevents filenames that exceed length limits", async () => {
			const organizationId = await createTestOrganization();
			const mockFileUpload = {
				filename: "a".repeat(256) + ".png",
				mimetype: "image/png",
				encoding: "7bit",
				createReadStream: vi.fn(),
			};

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					attachments: [Promise.resolve(mockFileUpload)],
				},
			});
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
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
			expect(result.data.createEvent).toEqual(null);
			expectErrorCode(result, "invalid_arguments");
		});
	});

	suite("Successful Event Creation", () => {
		test("successfully creates a basic event", async () => {
			const organizationId = await createTestOrganization();

			const result = await createEvent({
				input: baseEventInput(organizationId),
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Test Event",
					description: "Test Description",
					organization: expect.objectContaining({
						id: organizationId,
						countryCode: "US",
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
			expect(result.data.createEvent).toEqual(
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
					startAt: new Date("2025-01-01T10:00:00Z"),
					endAt: new Date("2025-01-03T18:00:00Z"),
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.createEvent).toEqual(
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
			expect(result.data.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Private Event",
				}),
			);
		});

		test("allows organization members to create events", async () => {
			const organizationId = await createTestOrganization();
			const { userId: regularUserId, authToken: regularUserAuthToken } =
				await createOrganizationMember(organizationId);

			const result = await createEvent({
				input: { ...baseEventInput(organizationId), name: "Event by Member" },
			}, regularUserAuthToken);

			expect(result.errors).toBeUndefined();
			expect(result.data.createEvent).toEqual(
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
			expect(result.data.createEvent).toEqual(
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
			expect(result.data.createEvent).toEqual(
				expect.objectContaining({ id: expect.any(String), name: specialName }),
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
			expect(result.data.createEvent).toEqual(
				expect.objectContaining({ id: expect.any(String), name: "Daily Standup" }),
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
						endDate: new Date("2025-03-01T00:00:00Z"),
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.createEvent).toEqual(
				expect.objectContaining({ id: expect.any(String), name: "Weekly Meeting" }),
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
			expect(result.data.createEvent).toEqual(
				expect.objectContaining({ id: expect.any(String), name: "Weekday Training" }),
			);
		});

		test("handles file attachments properly", async () => {
			const organizationId = await createTestOrganization();

			// Mocks the file upload
			const mockFileUploads = [
				{
					filename: "agenda.pdf",
					mimetype: "application/pdf",
					encoding: "7bit",
					createReadStream: vi.fn().mockReturnValue({ pipe: vi.fn(), on: vi.fn() }),
				},
			];

			vi.spyOn(server.minio.client, "putObject").mockResolvedValue({
				etag: "mock-etag",
				versionId: "mock-version",
			});

			const result = await createEvent({
				input: {
					...baseEventInput(organizationId),
					name: "Event with Documents",
					attachments: mockFileUploads.map(upload => Promise.resolve(upload)),
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.createEvent).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: "Event with Documents",
				}),
			);

			expect(server.minio.client.putObject).toHaveBeenCalledTimes(1);
			vi.restoreAllMocks();
		});
	});

	suite("Error Handling", () => {
		test("gracefully handles database insertion failures", async () => {
			const organizationId = await createTestOrganization();

			// Simulate what happens when the database fails
			const originalInsert = server.drizzleClient.insert;
			vi.spyOn(server.drizzleClient, "insert").mockImplementation((...args) => {
				const result = originalInsert.apply(server.drizzleClient, args);
				return {
					...result,
					returning: vi.fn().mockResolvedValue([]),
				} as any;
			});

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

			vi.restoreAllMocks();
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
					startAt: new Date("2025-01-01T00:00:00Z"),
					endAt: new Date("2025-01-01T01:00:00Z"),
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
			const { authToken: memberAuthToken } = await createOrganizationMember(organizationId);

			const event1Result = await createEvent({
				input: { ...baseEventInput(organizationId), name: "First Event" },
			}, memberAuthToken);

			const event2Result = await createEvent({
				input: { ...baseEventInput(organizationId), name: "Second Event" },
			}, memberAuthToken);

			expectSuccessfulEvent(event1Result, "First Event");
			expectSuccessfulEvent(event2Result, "Second Event");
		});
	});
});