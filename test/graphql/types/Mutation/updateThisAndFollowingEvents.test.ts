import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_updateThisAndFollowingEvents,
	Query_signIn,
} from "../documentNodes";

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
		originalSeriesId: faker.string.uuid(),
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
			organizationId: orgId,
			creatorId: userId,
			updaterId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		recurrenceRule: {
			id: faker.string.uuid(),
			frequency: "WEEKLY",
			interval: 1,
			recurrenceEndDate: null,
			count: null,
			byDay: null,
			byMonth: null,
			byMonthDay: null,
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

suite("Mutation field updateThisAndFollowingEvents", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated Name",
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			// Delete the user
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
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

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["input", "id"] }),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});
	});

	suite("when the specified recurring event instance does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
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

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["input", "id"] }),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});
	});

	suite("when the recurring event instance is cancelled", () => {
		test("should return an error with invalid_arguments code", async () => {
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock cancelled instance
			const originalInstanceFindFirst =
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
				); // isCancelled = true

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateThisAndFollowingEvents,
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

				expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
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
							path: ["updateThisAndFollowingEvents"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
			}
		});
	});

	suite("when the recurring event instance is cancelled", () => {
		test("should return an error with invalid_arguments code", async () => {
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock valid instance
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			// Mock transaction that throws unauthenticated error when user is undefined
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					// Simulate the mutation logic throwing when currentUserId is undefined
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateThisAndFollowingEvents,
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

				expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							path: ["updateThisAndFollowingEvents"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when created event is undefined", () => {
		test("should return an error with unexpected extensions code", async () => {
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock valid instance
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			// Mock transaction that throws unexpected error when event creation returns undefined
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					// Simulate the mutation logic throwing when createdEvent is undefined
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateThisAndFollowingEvents,
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

				expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateThisAndFollowingEvents"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when created recurrence rule is undefined", () => {
		test("should return an error with unexpected extensions code", async () => {
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock valid instance
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			// Mock transaction that throws unexpected error when recurrence rule creation returns undefined
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					// Simulate the mutation logic throwing when createdRecurrenceRule is undefined
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateThisAndFollowingEvents,
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

				expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateThisAndFollowingEvents"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when first instance is undefined after generation", () => {
		test("should return an error with unexpected extensions code", async () => {
			const instanceId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock valid instance
			const originalInstanceFindFirst =
				server.drizzleClient.query.recurringEventInstancesTable.findFirst;
			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.query.recurringEventInstancesTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockRecurringEventInstance(instanceId, orgId, "admin-user-id"),
				);

			// Mock transaction that throws unexpected error when first instance is undefined
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					// Simulate the mutation logic throwing when firstInstance is undefined
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateThisAndFollowingEvents,
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

				expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateThisAndFollowingEvents"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.recurringEventInstancesTable.findFirst =
					originalInstanceFindFirst;
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code for invalid UUID", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
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

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.any(Array),
									message: expect.stringContaining("Must be a valid UUID"),
								}),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error when no update fields are provided", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
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
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error when endAt is before startAt (both provided)", async () => {
			const startTime = "2024-12-02T14:00:00Z";
			const endTime = "2024-12-02T12:00:00Z"; // Earlier than start

			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
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

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
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
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error for name that is too short", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "", // Empty string
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "name"],
									message: "Name must be at least 1 character long.",
								}),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error for name that is too long", async () => {
			const longName = "a".repeat(257); // 257 characters

			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							name: longName,
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "name"],
									message: "Name must be at most 256 characters long.",
								}),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error for description that is too short", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							description: "", // Empty string
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "description"],
									message: "Description must be at least 1 character long.",
								}),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error for description that is too long", async () => {
			const longDescription = "a".repeat(2049); // 2049 characters

			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							description: longDescription,
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "description"],
									message: "Description must be at most 2048 characters long.",
								}),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error for location that is too short", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							location: "", // Empty string
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "location"],
									message: "Location must be at least 1 character long.",
								}),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});

		test("should return an error for location that is too long", async () => {
			const longLocation = "a".repeat(1025); // 1025 characters

			const result = await mercuriusClient.mutate(
				Mutation_updateThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							location: longLocation,
						},
					},
				},
			);

			expect(result.data?.updateThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "location"],
									message: "Location must be at most 1024 characters long.",
								}),
							]),
						}),
						path: ["updateThisAndFollowingEvents"],
					}),
				]),
			);
		});
	});
});
