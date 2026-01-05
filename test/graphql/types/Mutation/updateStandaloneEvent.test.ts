import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_updateStandaloneEvent,
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
					description: "Organization for standalone event tests",
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

// Mock function to simulate finding a standalone event
function mockStandaloneEvent(
	eventId: string,
	orgId: string,
	_userId: string,
	userRole: "administrator" | "member" = "administrator",
) {
	return {
		id: eventId,
		startAt: new Date("2024-12-01T10:00:00Z"),
		endAt: new Date("2024-12-01T12:00:00Z"),
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		location: "Original Location",
		isInviteOnly: false,
		organizationId: orgId,
		attachmentsWhereEvent: [
			{
				mimeType: "application/pdf",
			},
		],
		organization: {
			countryCode: "us",
			membershipsWhereOrganization: [
				{
					role: userRole,
				},
			],
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

suite("Mutation field updateStandaloneEvent", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateStandaloneEvent,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated Name",
						},
					},
				},
			);

			expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateStandaloneEvent"],
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
				Mutation_updateStandaloneEvent,
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

			expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateStandaloneEvent"],
					}),
				]),
			);
		});
	});

	suite("when the specified standalone event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateStandaloneEvent,
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

			expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["input", "id"] }),
							]),
						}),
						path: ["updateStandaloneEvent"],
					}),
				]),
			);
		});
	});

	suite("when user lacks permission to update the event", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources for non-admin user", async () => {
			const { authToken: regularToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularToken);
			assertToBeNonNullish(userId);

			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock event with regular user as non-admin member
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "regular" });
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockStandaloneEvent(eventId, orgId, userId, "member"),
				);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${regularToken}` },
						variables: {
							input: {
								id: eventId,
								name: "Updated Name",
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({ argumentPath: ["input", "id"] }),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
			}
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code for invalid UUID", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateStandaloneEvent,
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

			expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
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
						path: ["updateStandaloneEvent"],
					}),
				]),
			);
		});

		test("should return an error when no update fields are provided", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateStandaloneEvent,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									message: "At least one optional argument must be provided.",
								}),
							]),
						}),
						path: ["updateStandaloneEvent"],
					}),
				]),
			);
		});

		test("should return an error when endAt is before startAt (both provided)", async () => {
			const startTime = "2024-12-02T14:00:00Z";
			const endTime = "2024-12-02T12:00:00Z"; // Earlier than start

			const result = await mercuriusClient.mutate(
				Mutation_updateStandaloneEvent,
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

			expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "endAt"],
									message: expect.stringContaining(
										"Must be greater than the value",
									),
								}),
							]),
						}),
						path: ["updateStandaloneEvent"],
					}),
				]),
			);
		});

		test("should return an error when both isPublic and isInviteOnly are set to true", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock event with isPublic=false, isInviteOnly=false
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = false;
			mockEvent.isInviteOnly = false;

			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								isPublic: true,
								isInviteOnly: true,
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
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
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
			}
		});

		test("should return an error when isInviteOnly conflicts with inherited isPublic", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			// Mock existing event: isPublic=true, isInviteOnly=false
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = true;
			mockEvent.isInviteOnly = false;

			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								isInviteOnly: true, // Conflict: final state is Public=true (inherited), InviteOnly=true
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
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
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
			}
		});

		test("should return an error when isPublic conflicts with inherited isInviteOnly", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			// Mock existing event: isPublic=false, isInviteOnly=true
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = false;
			mockEvent.isInviteOnly = true;

			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								isPublic: true, // Conflict: final state is Public=true, InviteOnly=true (inherited)
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
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
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
			}
		});

		test("should return an error when updating unrelated field on legacy invalid event", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			// Mock existing legacy invalid event: isPublic=true, isInviteOnly=true
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = true;
			mockEvent.isInviteOnly = true;

			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								name: "New Name", // Unrelated update
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
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
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
			}
		});
	});

	suite("when timing validation fails in resolver", () => {
		test("should return an error when only endAt is provided and it's before existing startAt", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock event with specific timing
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			// Set existing start time to be after the new end time we'll provide
			mockEvent.startAt = new Date("2024-12-02T15:00:00Z");
			mockEvent.endAt = new Date("2024-12-02T17:00:00Z");

			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								endAt: "2024-12-02T14:00:00Z", // End before existing start
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "endAt"],
										message: expect.stringContaining(
											"Must be greater than the value",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
			}
		});

		test("should return an error when only startAt is provided and it's after existing endAt", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock event with specific timing
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			// Set existing end time to be before the new start time we'll provide
			mockEvent.startAt = new Date("2024-12-02T10:00:00Z");
			mockEvent.endAt = new Date("2024-12-02T12:00:00Z");

			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								startAt: "2024-12-02T14:00:00Z", // Start after existing end
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "startAt"],
										message: expect.stringContaining(
											"Must be smaller than the value",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
			}
		});
	});

	suite("when update operation fails unexpectedly", () => {
		test("should return an error with unexpected extensions code when updatedEvent is undefined", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful validation but failed update
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;
			const originalUpdate = server.drizzleClient.update;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				);

			// Mock update that returns empty array (which makes updatedEvent undefined)
			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]), // Empty array causes updatedEvent to be undefined
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								name: "Updated Name",
							},
						},
					},
				);

				expect(result.data?.updateStandaloneEvent ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});
	});

	suite("successful update scenarios", () => {
		test("should successfully update basic event properties", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;
			const originalUpdate = server.drizzleClient.update;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				);

			// Mock successful update
			const updatedEvent = {
				id: eventId,
				name: "Updated Event Name",
				description: "Updated description",
				location: "Updated Location",
				startAt: new Date("2024-12-01T10:00:00Z"),
				endAt: new Date("2024-12-01T12:00:00Z"),
				allDay: false,
				isPublic: false,
				isRegisterable: false,
				organizationId: orgId,
			};

			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
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
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						name: "Updated Event Name",
						description: "Updated description",
						location: "Updated Location",
						isPublic: false,
						isRegisterable: false,
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should successfully update timing fields", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;
			const originalUpdate = server.drizzleClient.update;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				);

			// Mock successful update
			const updatedEvent = {
				id: eventId,
				name: "Test Standalone Event",
				description: "A test standalone event",
				location: "Original Location",
				startAt: new Date("2024-12-02T14:00:00Z"),
				endAt: new Date("2024-12-02T16:00:00Z"),
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				organizationId: orgId,
			};

			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								startAt: "2024-12-02T14:00:00Z",
								endAt: "2024-12-02T16:00:00Z",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						startAt: "2024-12-02T14:00:00.000Z",
						endAt: "2024-12-02T16:00:00.000Z",
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should allow organization administrator to update event", async () => {
			const { authToken: regularToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularToken);
			assertToBeNonNullish(userId);

			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock regular user as organization administrator
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;
			const originalUpdate = server.drizzleClient.update;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "regular" }); // Regular user, not platform admin
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockStandaloneEvent(eventId, orgId, userId, "administrator"),
				); // But org admin

			// Mock successful update
			const updatedEvent = {
				id: eventId,
				name: "Updated by Org Admin",
				description: "A test standalone event",
				location: "Original Location",
				startAt: new Date("2024-12-01T10:00:00Z"),
				endAt: new Date("2024-12-01T12:00:00Z"),
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				organizationId: orgId,
			};

			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${regularToken}` },
						variables: {
							input: {
								id: eventId,
								name: "Updated by Org Admin",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						name: "Updated by Org Admin",
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should preserve attachments in the response", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;
			const originalUpdate = server.drizzleClient.update;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			// Mock successful update
			const updatedEvent = {
				id: eventId,
				name: "Updated Event Name",
				description: "Updated description",
				location: "Updated Location",
				startAt: new Date("2024-12-01T10:00:00Z"),
				endAt: new Date("2024-12-01T12:00:00Z"),
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				organizationId: orgId,
			};

			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								name: "Updated Event Name",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						name: "Updated Event Name",
						attachments: expect.arrayContaining([
							expect.objectContaining({
								mimeType: "application/pdf",
							}),
						]),
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should successfully update isInviteOnly field", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;
			const originalUpdate = server.drizzleClient.update;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = false; // Set to false to avoid illegal state
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(mockEvent);

			// Mock successful update with isInviteOnly
			const updatedEvent = {
				id: eventId,
				name: "Test Standalone Event",
				description: "A test standalone event",
				location: "Original Location",
				startAt: new Date("2024-12-01T10:00:00Z"),
				endAt: new Date("2024-12-01T12:00:00Z"),
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isInviteOnly: true,
				organizationId: orgId,
			};

			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								isInviteOnly: true,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						isInviteOnly: true,
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should successfully update isInviteOnly from true to false", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			const originalEventFindFirst =
				server.drizzleClient.query.eventsTable.findFirst;
			const originalUpdate = server.drizzleClient.update;

			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });
			server.drizzleClient.query.eventsTable.findFirst = vi
				.fn()
				.mockResolvedValue(
					mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				);

			// Mock successful update with isInviteOnly set to false
			const updatedEvent = {
				id: eventId,
				name: "Test Standalone Event",
				description: "A test standalone event",
				location: "Original Location",
				startAt: new Date("2024-12-01T10:00:00Z"),
				endAt: new Date("2024-12-01T12:00:00Z"),
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: orgId,
			};

			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								isInviteOnly: false,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						isInviteOnly: false,
					}),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.query.eventsTable.findFirst =
					originalEventFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});
	});
});
