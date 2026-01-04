import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
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

afterEach(async () => {
	vi.clearAllMocks();
	// Clear rate limit keys to prevent rate limiting between tests
	const keys = await server.redis.keys("rate-limit:*");
	if (keys.length > 0) {
		await server.redis.del(...keys);
	}
});

// Helper function to create a test organization
async function createTestOrganization(authToken: string) {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Org ${faker.string.alphanumeric(8)}`,
					description: "Organization for recurring event tests",
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
) {
	return {
		id: instanceId,
		isCancelled,
		actualStartTime: new Date("2024-12-02T10:00:00Z"),
		actualEndTime: new Date("2024-12-02T12:00:00Z"),
		baseRecurringEventId: faker.string.uuid(),
		recurrenceRuleId: faker.string.uuid(),
		originalInstanceStartTime: "2024-12-02T10:00:00Z",
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
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly,
			creatorId: userId,
			updaterId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	};
}

// Get admin authentication token
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
	});

	suite("when timing validation fails in resolver", () => {
		test("should return an error when calculated endAt is before startAt", async () => {
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

	suite("successful update scenarios", () => {
		test("should successfully update basic instance properties", async () => {
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
