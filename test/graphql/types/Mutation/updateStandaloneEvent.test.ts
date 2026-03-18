import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
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

const createdOrganizationIds = new Set<string>();
const createdUserIds = new Set<string>();

afterEach(async () => {
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

	const userIds = [...createdUserIds];
	if (userIds.length > 0) {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(inArray(organizationMembershipsTable.memberId, userIds))
			.execute();

		await server.drizzleClient
			.delete(usersTable)
			.where(inArray(usersTable.id, userIds))
			.execute();

		createdUserIds.clear();
	}

	vi.restoreAllMocks();
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
	createdOrganizationIds.add(orgId);
	return orgId;
}

async function createTrackedRegularUser() {
	const user = await createRegularUserUsingAdmin();
	assertToBeNonNullish(user.userId);
	createdUserIds.add(user.userId);
	return user;
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
			const { authToken: userToken } = await createTrackedRegularUser();
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
				await createTrackedRegularUser();
			assertToBeNonNullish(regularToken);
			assertToBeNonNullish(userId);

			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock event with regular user as non-admin member

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "regular" });
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(
				mockStandaloneEvent(eventId, orgId, userId, "member"),
			);

			{
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
										"End time must be after start time",
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

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = false;
			mockEvent.isInviteOnly = false;

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
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
			}
		});

		test("should return an error when isInviteOnly conflicts with inherited isPublic", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			// Mock existing event: isPublic=true, isInviteOnly=false
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = true;
			mockEvent.isInviteOnly = false;

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
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
			}
		});

		test("should return an error when isPublic conflicts with inherited isInviteOnly", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			// Mock existing event: isPublic=false, isInviteOnly=true
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = false;
			mockEvent.isInviteOnly = true;

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
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
			}
		});

		test("should return an error when updating unrelated field on legacy invalid event", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			// Mock existing legacy invalid event: isPublic=true, isInviteOnly=true
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = true;
			mockEvent.isInviteOnly = true;

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
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
			}
		});
	});

	suite("when timing validation fails in resolver", () => {
		test("should return an error when only endAt is provided and it's before existing startAt", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock event with specific timing

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			// Set existing start time to be after the new end time we'll provide
			mockEvent.startAt = new Date("2024-12-02T15:00:00Z");
			mockEvent.endAt = new Date("2024-12-02T17:00:00Z");

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
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
											"End time must be after start time",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			}
		});

		test("should return an error when only startAt is provided and it's after existing endAt", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock event with specific timing

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			// Set existing end time to be before the new start time we'll provide
			mockEvent.startAt = new Date("2024-12-02T10:00:00Z");
			mockEvent.endAt = new Date("2024-12-02T12:00:00Z");

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
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
											"Start time must be before end time",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			}
		});

		test("should return an error when only endDate is provided and it is not greater than existing startDate", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			const mockEvent = {
				...mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				startDate: "2024-12-05",
				endDate: "2024-12-07",
				startAt: null,
				endAt: null,
			};

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
				// Provide endDate equal to existingEvent.startDate (triggers <= check)
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								endDate: "2024-12-05", // equal to existing startDate
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
										argumentPath: ["input", "endDate"],
										message: expect.stringContaining(
											"End date must be after start date for all-day events",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			}
		});

		test("should return an error when only startDate is provided and it is not smaller than existing endDate", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			const mockEvent = {
				...mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				startDate: "2024-12-05",
				endDate: "2024-12-07",
				startAt: null,
				endAt: null,
			};

			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

			{
				// Provide startDate equal to existingEvent.endDate (triggers >= check)
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								startDate: "2024-12-07", // equal to existing endDate
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
										argumentPath: ["input", "startDate"],
										message: expect.stringContaining(
											"Start date must be before end date for all-day events",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			}
		});

		test("should return an error when allDay is set to true without providing startDate and endDate", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			// Existing event is a timed event
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockStandaloneEvent(eventId, orgId, "admin-user-id"));

			{
				// Send allDay: true but omit startDate and endDate
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								allDay: true,
								// No startDate or endDate provided
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
										argumentPath: ["input"],
										message: expect.stringContaining(
											"All-day events require startDate and endDate fields",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			}
		});

		test("should return an error when allDay is set to false without providing startAt and endAt", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			// Existing event is an all-day event
			const allDayMockEvent = {
				...mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				startAt: null,
				endAt: null,
				startDate: "2024-12-05",
				endDate: "2024-12-06",
				allDay: true,
			};
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(allDayMockEvent);

			{
				// Send allDay: false but omit startAt and endAt
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								allDay: false,
								// No startAt or endAt provided
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
										argumentPath: ["input"],
										message: expect.stringContaining(
											"Timed events require startAt and endAt fields",
										),
									}),
								]),
							}),
							path: ["updateStandaloneEvent"],
						}),
					]),
				);
			}
		});
	});

	suite("when update operation fails unexpectedly", () => {
		test("should return an error with unexpected extensions code when updatedEvent is undefined", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful validation but failed update

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockStandaloneEvent(eventId, orgId, "admin-user-id"));

			// Mock update that returns empty array (which makes updatedEvent undefined)
			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]), // Empty array causes updatedEvent to be undefined
					}),
				}),
			});

			{
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
			}
		});
	});

	suite("successful update scenarios", () => {
		test("should successfully update basic event properties", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockStandaloneEvent(eventId, orgId, "admin-user-id"));

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

			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			{
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
			}
		});

		test("should successfully update timing fields", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockStandaloneEvent(eventId, orgId, "admin-user-id"));

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

			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			{
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
			}
		});

		test("should allow organization administrator to update event", async () => {
			const { authToken: regularToken, userId } =
				await createTrackedRegularUser();
			assertToBeNonNullish(regularToken);
			assertToBeNonNullish(userId);

			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock regular user as organization administrator

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "regular" }); // Regular user, not platform admin
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(
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

			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			{
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
			}
		});

		test("should preserve attachments in the response", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });

			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

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

			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			{
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
			}
		});

		test("should successfully update isInviteOnly field", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });
			const mockEvent = mockStandaloneEvent(eventId, orgId, "admin-user-id");
			mockEvent.isPublic = false; // Set to false to avoid illegal state
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockEvent);

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

			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			{
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
			}
		});

		test("should successfully update isInviteOnly from true to false", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			// Mock successful scenario

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockStandaloneEvent(eventId, orgId, "admin-user-id"));

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

			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedEvent]),
					}),
				}),
			});

			{
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
			}
		});

		test("should clear startAt and endAt when switching to allDay true", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });
			// Existing event is a timed event
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(mockStandaloneEvent(eventId, orgId, "admin-user-id"));

			// Updated event should have allDay true and cleared startAt/endAt
			const updatedEvent = {
				id: eventId,
				name: "Test Standalone Event",
				description: "A test standalone event",
				location: "Original Location",
				startAt: null,
				endAt: null,
				startDate: "2024-12-05",
				endDate: "2024-12-06",
				allDay: true,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: orgId,
			};

			let capturedSetData: Record<string, unknown> = {};
			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockImplementation((data) => {
					capturedSetData = data;
					return {
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([updatedEvent]),
						}),
					};
				}),
			});

			{
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								allDay: true,
								startDate: "2024-12-05",
								endDate: "2024-12-06",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						allDay: true,
					}),
				);
				// Verify that startAt and endAt were explicitly set to null
				expect(capturedSetData).toMatchObject({
					allDay: true,
					startAt: null,
					endAt: null,
				});
			}
		});

		test("should clear startDate and endDate when switching to allDay false", async () => {
			const eventId = faker.string.uuid();
			const orgId = await createTestOrganization(adminToken);

			vi.spyOn(
				server.drizzleClient.query.usersTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue({ role: "administrator" });
			// Existing event is an all-day event
			const allDayMockEvent = {
				...mockStandaloneEvent(eventId, orgId, "admin-user-id"),
				startAt: null,
				endAt: null,
				startDate: "2024-12-05",
				endDate: "2024-12-06",
				allDay: true,
			};
			vi.spyOn(
				server.drizzleClient.query.eventsTable as unknown as {
					findFirst: (...args: unknown[]) => unknown;
				},
				"findFirst",
			).mockResolvedValue(allDayMockEvent);

			// Updated event should have allDay false and cleared startDate/endDate
			const updatedEvent = {
				id: eventId,
				name: "Test Standalone Event",
				description: "A test standalone event",
				location: "Original Location",
				startAt: new Date("2024-12-05T10:00:00Z"),
				endAt: new Date("2024-12-05T12:00:00Z"),
				startDate: null,
				endDate: null,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				organizationId: orgId,
			};

			let capturedSetData: Record<string, unknown> = {};
			vi.spyOn(
				server.drizzleClient as unknown as {
					update: (...args: unknown[]) => unknown;
				},
				"update",
			).mockReturnValue({
				set: vi.fn().mockImplementation((data) => {
					capturedSetData = data;
					return {
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([updatedEvent]),
						}),
					};
				}),
			});

			{
				const result = await mercuriusClient.mutate(
					Mutation_updateStandaloneEvent,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: eventId,
								allDay: false,
								startAt: "2024-12-05T10:00:00Z",
								endAt: "2024-12-05T12:00:00Z",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateStandaloneEvent).toEqual(
					expect.objectContaining({
						id: eventId,
						allDay: false,
					}),
				);
				// Verify that startDate and endDate were explicitly set to null
				expect(capturedSetData).toMatchObject({
					allDay: false,
					startDate: null,
					endDate: null,
				});
			}
		});
	});
});
