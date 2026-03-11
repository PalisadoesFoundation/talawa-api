import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_updateSingleRecurringEventInstance,
	Query_signIn,
} from "../documentNodes";

// Store original database query methods to restore after each test
const originalDbQueries = {
	usersTableFindFirst: server.drizzleClient.query.usersTable.findFirst,
	recurringEventInstancesTableFindFirst:
		server.drizzleClient.query.recurringEventInstancesTable.findFirst,
	drizzleTransaction: server.drizzleClient.transaction,
};

const createdOrganizationIds = new Set<string>();

beforeEach(() => {
	// Ensure all database query methods are restored before each test
	server.drizzleClient.query.usersTable.findFirst =
		originalDbQueries.usersTableFindFirst;
	server.drizzleClient.query.recurringEventInstancesTable.findFirst =
		originalDbQueries.recurringEventInstancesTableFindFirst;
	server.drizzleClient.transaction = originalDbQueries.drizzleTransaction;
});

afterEach(async () => {
	// Clear all mocks and restore original implementations
	vi.clearAllMocks();
	vi.restoreAllMocks();

	// Explicitly restore database query methods to prevent mock leakage
	server.drizzleClient.query.usersTable.findFirst =
		originalDbQueries.usersTableFindFirst;
	server.drizzleClient.query.recurringEventInstancesTable.findFirst =
		originalDbQueries.recurringEventInstancesTableFindFirst;
	server.drizzleClient.transaction = originalDbQueries.drizzleTransaction;

	const organizationIds = [...createdOrganizationIds];
	if (organizationIds.length > 0) {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				inArray(organizationMembershipsTable.organizationId, organizationIds),
			)
			.execute();

		await server.drizzleClient
			.delete(organizationsTable)
			.where(inArray(organizationsTable.id, organizationIds))
			.execute();

		createdOrganizationIds.clear();
	}
});

// Helper function to get admin authentication token
async function getAdminAuthToken(): Promise<string> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	const adminToken = signInResult.data?.signIn?.authenticationToken ?? null;
	assertToBeNonNullish(adminToken);
	return adminToken;
}

// Helper function to create a test organization with unique name
async function createTestOrganization(authToken: string) {
	// Use UUID to ensure unique organization name per test
	const uniqueId = faker.string.uuid();
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Org ${uniqueId}`,
					description: `Organization for recurring event tests ${uniqueId}`,
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "123 Main St",
					addressLine2: "Suite 100",
				},
			},
		},
	);
	const orgId = createOrgResult.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	createdOrganizationIds.add(orgId);
	return orgId;
}

// Mock function to simulate finding a recurring event instance
function mockRecurringEventInstance(
	instanceId: string,
	orgId: string,
	userId: string,
	userRole: "administrator" | "member" = "administrator",
	isCancelled = false,
	isInviteOnly = false,
	allDay = false,
) {
	return {
		id: instanceId,
		isCancelled,
		actualStartTime: allDay ? null : new Date("2024-12-02T10:00:00Z"),
		actualEndTime: allDay ? null : new Date("2024-12-02T12:00:00Z"),
		actualStartDate: allDay ? "2024-12-02" : null,
		actualEndDate: allDay ? "2024-12-05" : null,
		originalInstanceStartTime: allDay ? null : "2024-12-02T10:00:00Z",
		originalInstanceStartDate: allDay ? "2024-12-02" : null,
		baseRecurringEventId: faker.string.uuid(),
		recurrenceRuleId: faker.string.uuid(),
		organizationId: orgId,
		generatedAt: "2024-12-02T09:00:00Z",
		lastUpdatedAt: new Date(),
		version: 1,
		sequenceNumber: 2,
		totalCount: 10,
		organization: {
			countryCode: "us",
			membershipsWhereOrganization: [
				{
					role: userRole,
				},
			],
		},
		baseRecurringEvent: {
			id: faker.string.uuid(),
			name: "Original Event Name",
			description: "Original description",
			location: "Original Location",
			allDay,
			isPublic: !isInviteOnly,
			isRegisterable: true,
			isInviteOnly,
			creatorId: userId,
			updaterId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	};
}

suite("Mutation field updateSingleRecurringEventInstance", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated Name",
						},
					},
				},
			);

			expect(
				result.data?.updateSingleRecurringEventInstance ?? null,
			).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateSingleRecurringEventInstance"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			// Delete the user
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated Name",
						},
					},
				},
			);

			expect(
				result.data?.updateSingleRecurringEventInstance ?? null,
			).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateSingleRecurringEventInstance"],
					}),
				]),
			);
		});
	});

	suite("when the specified recurring event instance does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const adminToken = await getAdminAuthToken();
			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated Name",
						},
					},
				},
			);

			expect(
				result.data?.updateSingleRecurringEventInstance ?? null,
			).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["input", "id"] }),
							]),
						}),
						path: ["updateSingleRecurringEventInstance"],
					}),
				]),
			);
		});
	});

	suite("when the recurring event instance is cancelled", () => {
		test("should return an error with invalid_arguments code", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock a cancelled instance
			const originalFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(
						instanceId,
						orgId,
						"admin-user-id",
						"administrator",
						true,
					),
				);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								name: "Updated Name",
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
										message:
											"Cannot update a cancelled recurring event instance.",
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalFindFirst;
			}
		});
	});

	suite("when user lacks permission to update the instance", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources for non-admin user", async () => {
			const adminToken = await getAdminAuthToken();
			const { authToken: regularToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularToken);
			assertToBeNonNullish(userId);

			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock instance with regular user as non-admin member
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "regular" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(
						instanceId,
						orgId,
						"different-user-id",
						"member",
					),
				);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${regularToken}` },
						variables: {
							input: {
								id: instanceId,
								name: "Updated Name",
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code for invalid UUID", async () => {
			const adminToken = await getAdminAuthToken();
			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: "invalid-uuid",
							name: "Updated Name",
						},
					},
				},
			);

			expect(
				result.data?.updateSingleRecurringEventInstance ?? null,
			).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.any(Array),
									message: expect.any(String),
								}),
							]),
						}),
						path: ["updateSingleRecurringEventInstance"],
					}),
				]),
			);
		});

		test("should return an error when no update fields are provided", async () => {
			const adminToken = await getAdminAuthToken();
			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(
				result.data?.updateSingleRecurringEventInstance ?? null,
			).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									message: "At least one field must be provided for update.",
								}),
							]),
						}),
						path: ["updateSingleRecurringEventInstance"],
					}),
				]),
			);
		});

		test("should return an error when endAt is before startAt", async () => {
			const adminToken = await getAdminAuthToken();
			const startTime = "2024-12-02T14:00:00Z";
			const endTime = "2024-12-02T12:00:00Z"; // Earlier than start

			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							startAt: startTime,
							endAt: endTime,
						},
					},
				},
			);

			expect(
				result.data?.updateSingleRecurringEventInstance ?? null,
			).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "endAt"],
									message: expect.stringContaining(
										"End time must be after start time",
									),
								}),
							]),
						}),
						path: ["updateSingleRecurringEventInstance"],
					}),
				]),
			);
		});

		test("should return an error for field length violations", async () => {
			const adminToken = await getAdminAuthToken();
			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "",
							description: "",
							location: "",
						},
					},
				},
			);

			expect(
				result.data?.updateSingleRecurringEventInstance ?? null,
			).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.any(Array),
									message: expect.stringContaining(
										"must be at least 1 character",
									),
								}),
							]),
						}),
						path: ["updateSingleRecurringEventInstance"],
					}),
				]),
			);
		});

		test("should return an error when isInviteOnly conflicts with existing isPublic state", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								isInviteOnly: true,
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "isPublic"],
										message: expect.stringContaining(
											"cannot be both Public and Invite-Only",
										),
									}),
									expect.objectContaining({
										argumentPath: ["input", "isInviteOnly"],
										message: expect.stringContaining(
											"cannot be both Public and Invite-Only",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});

		test("should return an error when input explicitly sets both isPublic and isInviteOnly to true", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								isPublic: true,
								isInviteOnly: true,
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "isPublic"],
										message: expect.stringContaining(
											"cannot be both Public and Invite-Only",
										),
									}),
									expect.objectContaining({
										argumentPath: ["input", "isInviteOnly"],
										message: expect.stringContaining(
											"cannot be both Public and Invite-Only",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});
	});

	suite("when timing validation fails in resolver", () => {
		test("should return an error when calculated endAt is before startAt", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock instance with specific timing
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
			);
			// Set times so that new start time will cause endAt to be before startAt
			mockInstance.actualStartTime = new Date("2024-12-02T10:00:00Z");
			mockInstance.actualEndTime = new Date("2024-12-02T11:00:00Z"); // 1 hour duration

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								startAt: "2024-12-02T15:00:00Z", // New start time
								endAt: "2024-12-02T14:00:00Z", // End before start
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "endAt"],
										message: expect.stringContaining(
											"End time must be after start time",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});

		test("should return an error when only endAt is provided and it's before existing startAt", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock instance with specific timing
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
			);
			// Set existing start time to be after the new end time we'll provide
			mockInstance.actualStartTime = new Date("2024-12-02T15:00:00Z");
			mockInstance.actualEndTime = new Date("2024-12-02T17:00:00Z");

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								endAt: "2024-12-02T14:00:00Z", // End before existing start
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "endAt"],
										message: expect.stringContaining(
											"End time must be after start time",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});

		test("should return an error when endAt exactly equals startAt", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock instance with specific timing
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
			);
			mockInstance.actualStartTime = new Date("2024-12-02T10:00:00Z");
			mockInstance.actualEndTime = new Date("2024-12-02T12:00:00Z");

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								startAt: "2024-12-02T14:00:00Z",
								endAt: "2024-12-02T14:00:00Z", // Same as start time
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "endAt"],
										message: expect.stringContaining(
											"End time must be after start time",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});
	});

	suite("when update operation fails unexpectedly", () => {
		test("should return an error with unexpected extensions code", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful validation but failed update
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			// Mock transaction that returns empty array from update
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockResolvedValue(undefined),
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([]), // Empty array causes error
								}),
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								name: "Updated Name",
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when all-day event date validation fails in resolver", () => {
		test("should successfully update startDate for an all-day event", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
				"administrator",
				false,
				false,
				true, // all-day event
			);

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			const updatedInstance = {
				id: instanceId,
				baseRecurringEventId: mockInstance.baseRecurringEventId,
				recurrenceRuleId: mockInstance.recurrenceRuleId,
				originalInstanceStartDate: "2024-12-02",
				actualStartDate: "2024-12-03",
				actualEndDate: "2024-12-05",
				organizationId: orgId,
				isCancelled: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const insertValuesSpy = vi.fn().mockResolvedValue(undefined);
			const updateSetSpy = vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([updatedInstance]),
				}),
			});

			// Mock successful transaction
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: insertValuesSpy,
						}),
						update: vi.fn().mockReturnValue({
							set: updateSetSpy,
						}),
					};
					return await callback(mockTx);
				});

			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: instanceId,
							allDay: true,
							startDate: "2024-12-03", // Update start date
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateSingleRecurringEventInstance).toMatchObject({
				id: instanceId,
				startDate: updatedInstance.actualStartDate,
				endDate: updatedInstance.actualEndDate,
				allDay: true,
			});

			// Verify persisted instance override fields were written.
			expect(updateSetSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					actualStartDate: updatedInstance.actualStartDate,
				}),
			);

			// Verify stored exception record includes the all-day override flag.
			expect(insertValuesSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					recurringEventInstanceId: instanceId,
					exceptionData: expect.objectContaining({
						allDay: true,
					}),
				}),
			);
			expect(result.data?.updateSingleRecurringEventInstance).toMatchObject({
				startDate: "2024-12-03",
				endDate: "2024-12-05",
			});
		});

		test("should successfully update endDate for an all-day event", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
				"administrator",
				false,
				false,
				true, // all-day event
			);

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			const updatedInstance = {
				id: instanceId,
				baseRecurringEventId: mockInstance.baseRecurringEventId,
				recurrenceRuleId: mockInstance.recurrenceRuleId,
				originalInstanceStartDate: "2024-12-02",
				actualStartDate: "2024-12-02",
				actualEndDate: "2024-12-06",
				organizationId: orgId,
				isCancelled: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const insertValuesSpy = vi.fn().mockResolvedValue(undefined);
			const updateSetSpy = vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([updatedInstance]),
				}),
			});

			// Mock successful transaction
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: insertValuesSpy,
						}),
						update: vi.fn().mockReturnValue({
							set: updateSetSpy,
						}),
					};
					return await callback(mockTx);
				});

			const result = await mercuriusClient.mutate(
				Mutation_updateSingleRecurringEventInstance,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: instanceId,
							allDay: true,
							endDate: "2024-12-06", // Update end date
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateSingleRecurringEventInstance).toMatchObject({
				id: instanceId,
				startDate: updatedInstance.actualStartDate,
				endDate: updatedInstance.actualEndDate,
				allDay: true,
			});

			// Verify persisted instance override fields were written.
			expect(updateSetSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					actualEndDate: updatedInstance.actualEndDate,
				}),
			);

			// Verify stored exception record includes the all-day override flag.
			expect(insertValuesSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					recurringEventInstanceId: instanceId,
					exceptionData: expect.objectContaining({
						allDay: true,
					}),
				}),
			);
			expect(result.data?.updateSingleRecurringEventInstance).toMatchObject({
				startDate: "2024-12-02",
				endDate: "2024-12-06",
			});
		});

		test("should return an error when endDate equals startDate for an all-day event", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
				"administrator",
				false,
				false,
				true, // all-day event
			);
			// Set dates so that when updated, endDate will equal startDate
			mockInstance.actualStartDate = "2024-12-05";
			mockInstance.actualEndDate = "2024-12-10";

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								allDay: true,
								endDate: "2024-12-05", // End date equals start date
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "endDate"],
										message: expect.stringContaining(
											"End date must be after start date",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});

		test("should return an error when endDate is before startDate for an all-day event", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
				"administrator",
				false,
				false,
				true, // all-day event
			);
			// Set dates so that when updated, endDate will be before startDate
			mockInstance.actualStartDate = "2024-12-10";
			mockInstance.actualEndDate = "2024-12-15";

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								allDay: true,
								endDate: "2024-12-08", // End date before start date
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "endDate"],
										message: expect.stringContaining(
											"End date must be after start date",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});

		test("should return an error when updating startDate causes it to be after existing endDate", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
				"administrator",
				false,
				false,
				true, // all-day event
			);
			// Set dates so that updating startDate will cause issues
			mockInstance.actualStartDate = "2024-12-02";
			mockInstance.actualEndDate = "2024-12-05";

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								allDay: true,
								startDate: "2024-12-06", // Start date after existing end date
							},
						},
					},
				);

				expect(
					result.data?.updateSingleRecurringEventInstance ?? null,
				).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "endDate"],
										message: expect.stringContaining(
											"End date must be after start date",
										),
									}),
								]),
							}),
							path: ["updateSingleRecurringEventInstance"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});
	});

	suite("successful update scenarios", () => {
		test("should successfully update basic instance properties", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			// Mock successful transaction
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockResolvedValue(undefined),
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										{
											id: instanceId,
											actualStartTime: new Date("2024-12-02T10:00:00Z"),
											actualEndTime: new Date("2024-12-02T12:00:00Z"),
											lastUpdatedAt: new Date(),
										},
									]),
								}),
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								name: "Updated Event Name",
								description: "Updated description",
								location: "Updated Location",
								isPublic: false,
								isRegisterable: false,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						name: "Updated Event Name",
						description: "Updated description",
						location: "Updated Location",
						isPublic: false,
						isRegisterable: false,
						hasExceptions: true,
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});

		test("should successfully update timing with proper duration maintenance", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
			);
			// Original duration: 2 hours
			mockInstance.actualStartTime = new Date("2024-12-02T10:00:00Z");
			mockInstance.actualEndTime = new Date("2024-12-02T12:00:00Z");

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			// Mock successful transaction
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockResolvedValue(undefined),
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										{
											id: instanceId,
											actualStartTime: new Date("2024-12-02T14:00:00Z"),
											actualEndTime: new Date("2024-12-02T16:00:00Z"), // Maintained 2-hour duration
											lastUpdatedAt: new Date(),
										},
									]),
								}),
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								startAt: "2024-12-02T14:00:00Z", // Only update start time
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						startAt: "2024-12-02T14:00:00.000Z",
						endAt: "2024-12-02T16:00:00.000Z", // Should maintain duration
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});

		test("should successfully update existing exception", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario with existing exception
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			// Mock successful transaction with existing exception
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue({
									id: faker.string.uuid(),
									exceptionData: { name: "Previous Name" },
								}),
							},
						},
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockResolvedValue(undefined),
							}),
						}),
					};

					// Second update call for the instance itself
					mockTx.update = vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([
									{
										id: instanceId,
										actualStartTime: new Date("2024-12-02T10:00:00Z"),
										actualEndTime: new Date("2024-12-02T12:00:00Z"),
										lastUpdatedAt: new Date(),
									},
								]),
							}),
						}),
					});

					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								name: "Updated Name via Exception",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						hasExceptions: true,
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});

		test("should allow organization administrator to update instance", async () => {
			const adminToken = await getAdminAuthToken();
			const { authToken: regularToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularToken);
			assertToBeNonNullish(userId);

			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock regular user as organization administrator
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "regular" }); // Regular user, not platform admin
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(
						instanceId,
						orgId,
						userId,
						"administrator",
					),
				); // But org admin

			// Mock successful transaction
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockResolvedValue(undefined),
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										{
											id: instanceId,
											actualStartTime: new Date("2024-12-02T10:00:00Z"),
											actualEndTime: new Date("2024-12-02T12:00:00Z"),
											lastUpdatedAt: new Date(),
										},
									]),
								}),
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${regularToken}` },
						variables: {
							input: {
								id: instanceId,
								name: "Updated by Org Admin",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						name: "Updated by Org Admin",
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});

		test("should update only non-timing fields when timing is not changed", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockInstance = mockRecurringEventInstance(
				instanceId,
				orgId,
				"admin-user-id",
			);
			// Set specific times that won't be changed
			const originalStartTime = new Date("2024-12-02T10:00:00Z");
			const originalEndTime = new Date("2024-12-02T12:00:00Z");
			mockInstance.actualStartTime = originalStartTime;
			mockInstance.actualEndTime = originalEndTime;

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockInstance);

			// Mock successful transaction - timing fields should NOT be in updateData
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockResolvedValue(undefined),
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockImplementation((updateData) => {
								// Verify that timing fields are NOT included when not changed
								expect(updateData.actualStartTime).toBeUndefined();
								expect(updateData.actualEndTime).toBeUndefined();
								expect(updateData.lastUpdatedAt).toBeDefined();
								return {
									where: vi.fn().mockReturnValue({
										returning: vi.fn().mockResolvedValue([
											{
												id: instanceId,
												actualStartTime: originalStartTime, // Unchanged
												actualEndTime: originalEndTime, // Unchanged
												lastUpdatedAt: new Date(),
											},
										]),
									}),
								};
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								name: "Updated Name Only",
								// No startAt or endAt provided - timing should not change
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						name: "Updated Name Only",
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});

		test("should successfully override isInviteOnly from true to false", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario with isInviteOnly = true
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(
						instanceId,
						orgId,
						"admin-user-id",
						"administrator",
						false,
						true, // Original isInviteOnly = true
					),
				);

			// Mock successful transaction
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockResolvedValue(undefined),
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										{
											id: instanceId,
											actualStartTime: new Date("2024-12-02T10:00:00Z"),
											actualEndTime: new Date("2024-12-02T12:00:00Z"),
											lastUpdatedAt: new Date(),
										},
									]),
								}),
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								isInviteOnly: false, // Override to false
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						isInviteOnly: false, // Should be false after override
						hasExceptions: true,
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});

		test("should successfully override isInviteOnly from false to true", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario with isInviteOnly = false
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(
						instanceId,
						orgId,
						"admin-user-id",
						"administrator",
						false,
						false, // Original isInviteOnly = false
					),
				);

			// Mock successful transaction
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: vi.fn().mockResolvedValue(undefined),
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										{
											id: instanceId,
											actualStartTime: new Date("2024-12-02T10:00:00Z"),
											actualEndTime: new Date("2024-12-02T12:00:00Z"),
											lastUpdatedAt: new Date(),
										},
									]),
								}),
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								isInviteOnly: true, // Override to true
								isPublic: false,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						isInviteOnly: true, // Should be true after override
						hasExceptions: true,
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});

		test("should persist isInviteOnly override in exception data", async () => {
			const adminToken = await getAdminAuthToken();
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(
						instanceId,
						orgId,
						"admin-user-id",
						"administrator",
						false,
						false, // Original isInviteOnly = false
					),
				);

			// Mock successful transaction - verify exception data includes isInviteOnly
			const insertValuesSpy = vi.fn().mockResolvedValue(undefined);
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						query: {
							eventExceptionsTable: {
								findFirst: vi.fn().mockResolvedValue(null),
							},
						},
						insert: vi.fn().mockReturnValue({
							values: insertValuesSpy,
						}),
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										{
											id: instanceId,
											actualStartTime: new Date("2024-12-02T10:00:00Z"),
											actualEndTime: new Date("2024-12-02T12:00:00Z"),
											lastUpdatedAt: new Date(),
										},
									]),
								}),
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateSingleRecurringEventInstance,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: instanceId,
								isInviteOnly: true, // Override to true
								isPublic: false,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateSingleRecurringEventInstance).toEqual(
					expect.objectContaining({
						id: instanceId,
						isInviteOnly: true,
						hasExceptions: true,
					}),
				);

				// Verify that exception data includes isInviteOnly
				expect(insertValuesSpy).toHaveBeenCalled();
				const insertCall = insertValuesSpy.mock.calls[0]?.[0];
				expect(insertCall).toBeDefined();
				expect(insertCall.exceptionData).toBeDefined();
				expect(insertCall.exceptionData.isInviteOnly).toBe(true);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});
});
