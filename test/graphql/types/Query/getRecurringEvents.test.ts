import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { afterEach, expect, suite, test, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { organizationMembershipsTable } from "../../../../src/drizzle/tables/organizationMemberships";
import { usersTable } from "../../../../src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import {
	cancelInstances,
	createRecurringEventWithInstances,
} from "../../../helpers/recurringEventTestHelpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Query_getRecurringEvents,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_createUser =
	gql(`mutation Mutation_createUser($input: MutationCreateUserInput!) {
    createUser(input: $input){
        authenticationToken
        user {
            id
        }
    }
}`);

const Mutation_deleteOrganization =
	gql(`mutation Mutation_deleteOrganization($input: MutationDeleteOrganizationInput!) {
    deleteOrganization(input: $input) {
        id
    }
}`);

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
const adminUserId = signInResult.data.signIn.user?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Query field getRecurringEvents", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of [...cleanupFns].reverse()) {
			try {
				await cleanup();
			} catch (_error) {
				console.error("Cleanup failure in getRecurringEvents tests:", _error);
			}
		}
		cleanupFns.length = 0;
		vi.restoreAllMocks();
	});

	suite("when input validation fails", () => {
		test("should return an error when baseRecurringEventId is empty string", async () => {
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: "",
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("should return an error when baseRecurringEventId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: "invalid-uuid",
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("should return an error when baseRecurringEventId does not exist", async () => {
			const nonExistentId = faker.string.uuid();

			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: nonExistentId,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});

		test("should return an error when offset exceeds MAX_OFFSET (10000)", async () => {
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: faker.string.uuid(),
					offset: 10001,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["offset"] }),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when offset is negative", async () => {
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: faker.string.uuid(),
					offset: -1,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["offset"] }),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when limit exceeds maximum (1000)", async () => {
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: faker.string.uuid(),
					limit: 1001,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["limit"] }),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when limit is less than 1", async () => {
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: faker.string.uuid(),
					limit: 0,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["limit"] }),
							]),
						}),
					}),
				]),
			);
		});
	});

	suite("when authentication is required", () => {
		test("should validate that the query requires authentication", async () => {
			// Create valid recurring event first
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
				{ instanceCount: 1 },
			);

			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				// No authorization header
				variables: {
					baseRecurringEventId: templateId,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		});

		test("should return unauthenticated when authenticated user record is missing", async () => {
			const regularUserEmail = `missing-user-${faker.string.uuid()}@test.com`;
			const regularUserPassword = `Pwd-${faker.string.alphanumeric(16)}`;

			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: regularUserEmail,
							isEmailAddressVerified: false,
							name: faker.person.fullName(),
							password: regularUserPassword,
							role: "regular",
						},
					},
				},
			);
			assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
			const userId = createUserResult.data.createUser.user.id;
			cleanupFns.push(async () => {
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, userId));
			});

			const signInAsRegularUserResult = await mercuriusClient.query(
				Query_signIn,
				{
					variables: {
						input: {
							emailAddress: regularUserEmail,
							password: regularUserPassword,
						},
					},
				},
			);
			assertToBeNonNullish(signInAsRegularUserResult.data?.signIn);
			const regularUserToken =
				signInAsRegularUserResult.data.signIn.authenticationToken;
			assertToBeNonNullish(regularUserToken);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					baseRecurringEventId: faker.string.uuid(),
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});
	});

	suite("when user has insufficient permissions", () => {
		test("should return an error when user is not a member of the organization and not an admin", async () => {
			// Create a regular user (non-admin)
			const { authToken: regularUserToken, userId: regularUserId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(regularUserId);
			cleanupFns.push(async () => {
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, regularUserId));
			});

			// Create organization and event as admin first
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
						},
					},
				},
			);

			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			// Add admin as member so they can create events
			await server.drizzleClient.insert(organizationMembershipsTable).values({
				organizationId,
				memberId: adminUserId,
				role: "administrator",
			});

			const startAt = new Date("2030-06-15T10:00:00Z");
			const endAt = new Date("2030-06-15T11:00:00Z");

			// Create a recurring event template as admin
			const eventCreateResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.lorem.words(3),
							description: faker.lorem.sentence(),
							organizationId,
							startAt: startAt.toISOString(),
							endAt: endAt.toISOString(),
							recurrence: {
								frequency: "DAILY",
								interval: 1,
								count: 3,
							},
						},
					},
				},
			);

			assertToBeNonNullish(eventCreateResult.data?.createEvent);
			const eventId = eventCreateResult.data.createEvent.id;

			// Now try to access as regular user who is not a member of the organization
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					baseRecurringEventId: eventId,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});
	});

	suite("additional branch coverage", () => {
		test("should return invalid_arguments when base event exists but is not a recurring template", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Recurring branch org ${faker.string.uuid()}`,
						},
					},
				},
			);
			assertToBeNonNullish(createOrgResult.data?.createOrganization);
			const organizationId = createOrgResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			await server.drizzleClient.insert(organizationMembershipsTable).values({
				organizationId,
				memberId: adminUserId,
				role: "administrator",
			});

			const startAt = new Date("2030-01-01T10:00:00Z");
			const endAt = new Date("2030-01-01T11:00:00Z");

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.lorem.words(2),
							description: faker.lorem.sentence(),
							organizationId,
							startAt: startAt.toISOString(),
							endAt: endAt.toISOString(),
						},
					},
				},
			);
			assertToBeNonNullish(createEventResult.data?.createEvent);
			const standaloneEventId = createEventResult.data.createEvent.id;

			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: standaloneEventId,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["baseRecurringEventId"],
									message: "Event must be a recurring event template",
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should return unexpected when an internal non-Talawa error is thrown", async () => {
			vi.spyOn(
				server.drizzleClient.query.eventsTable,
				"findFirst",
			).mockImplementationOnce(() => {
				throw new Error("forced non-talawa error");
			});

			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: faker.string.uuid(),
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: "Failed to retrieve recurring events",
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
					}),
				]),
			);
		});
	});

	suite("includeCancelled Parameter Tests", () => {
		test("should return both active and cancelled instances when includeCancelled is true", async () => {
			// Setup: Create recurring event with 3 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			// Create a recurring event template with recurrence
			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 3,
				});
			const instanceToCancel = instanceIds[1];
			assertToBeNonNullish(instanceToCancel);
			await cancelInstances([instanceToCancel]);

			// Query with includeCancelled: true
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
					includeCancelled: true,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(3);

			// Verify cancelled instance is included
			const cancelledInstance = instances.find((i) => i.id === instanceIds[1]);
			expect(cancelledInstance).toBeDefined();
			expect(cancelledInstance?.isCancelled).toBe(true);
		});

		test("should return only active instances when includeCancelled is false", async () => {
			// Setup: Create recurring event with 3 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 3,
				});

			// Cancel the second instance
			const instanceToCancel = instanceIds[1];
			assertToBeNonNullish(instanceToCancel);
			await cancelInstances([instanceToCancel]);

			// Query with includeCancelled: false
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
					includeCancelled: false,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(2);

			// Verify cancelled instance is NOT included
			const cancelledInstance = instances.find((i) => i.id === instanceIds[1]);
			expect(cancelledInstance).toBeUndefined();
		});

		test("should exclude cancelled instances by default (when parameter is omitted)", async () => {
			// Setup: Create recurring event with 3 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 3,
				});

			// Cancel the second instance
			const instanceToCancel = instanceIds[1];
			assertToBeNonNullish(instanceToCancel);
			await cancelInstances([instanceToCancel]);

			// Query without includeCancelled
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(2);

			// Verify cancelled instance is NOT included
			const cancelledInstance = instances.find((i) => i.id === instanceIds[1]);
			expect(cancelledInstance).toBeUndefined();
		});
	});

	suite("Pagination Parameter Tests", () => {
		test("should respect limit parameter", async () => {
			// Setup: Create recurring event with 5 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
				{ instanceCount: 5 },
			);

			// Query with limit: 2
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
					limit: 2,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(2);
		});

		test("should respect offset parameter", async () => {
			// Setup: Create recurring event with 5 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 5,
				});

			// Query with offset: 2
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
					offset: 2,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(3); // 5 - 2 = 3

			// Verify we skipped the first 2
			const expectedInstanceId = instanceIds[2];
			const firstInstance = instances[0];
			assertToBeNonNullish(expectedInstanceId);
			assertToBeNonNullish(firstInstance);
			expect(firstInstance.id).toBe(expectedInstanceId);
		});

		test("should respect both limit and offset parameters", async () => {
			// Setup: Create recurring event with 5 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 5,
				});

			// Query with limit: 2, offset: 1
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
					limit: 2,
					offset: 1,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(2);

			// Verify we skipped the first 1 and took 2
			const expectedInstanceId1 = instanceIds[1];
			const expectedInstanceId2 = instanceIds[2];
			const firstInstance = instances[0];
			const secondInstance = instances[1];
			assertToBeNonNullish(expectedInstanceId1);
			assertToBeNonNullish(expectedInstanceId2);
			assertToBeNonNullish(firstInstance);
			assertToBeNonNullish(secondInstance);
			expect(firstInstance.id).toBe(expectedInstanceId1);
			expect(secondInstance.id).toBe(expectedInstanceId2);
		});

		test("should use default limit of 1000", async () => {
			// Setup: Create recurring event with many instances (e.g. 5)
			// We can't easily test 1001 instances without performance hit, but we can verify it returns all 5
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
				{ instanceCount: 5 },
			);

			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(5);
		});
	});

	suite("Authorization Scenarios", () => {
		test("should allow organization member (non-global-admin) to access", async () => {
			// Create a regular user
			const { authToken: regularUserToken, userId: regularUserId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(regularUserId);
			cleanupFns.push(async () => {
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, regularUserId));
			});

			// Create organization as admin
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			// Add regular user as member
			await server.drizzleClient.insert(organizationMembershipsTable).values({
				organizationId,
				memberId: regularUserId,
				role: "regular",
			});

			// Create recurring event template
			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
				{ instanceCount: 3 },
			);

			// Query as regular user
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					baseRecurringEventId: templateId,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(3);
		});

		test("should allow global administrator to access even if not a member", async () => {
			// Create organization as admin (unique name to avoid duplicate-name failures)
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Admin access org ${faker.string.ulid()}`,
						},
					},
				},
			);
			expect(organizationCreateResult.errors).toBeUndefined();
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			// Create recurring event template
			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
				{ instanceCount: 3 },
			);

			// Remove admin from organization membership
			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(
					and(
						eq(organizationMembershipsTable.organizationId, organizationId),
						eq(organizationMembershipsTable.memberId, adminUserId),
					),
				);

			// Query as admin (admin should have access even after being removed from org membership)
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(3);
		});
	});

	suite("Integration Tests", () => {
		test("should handle pagination with cancelled instances correctly", async () => {
			// Setup: Create recurring event with 5 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 5,
				});

			// Cancel the 3rd instance (index 2)
			const instanceToCancel = instanceIds[2];
			assertToBeNonNullish(instanceToCancel);
			await cancelInstances([instanceToCancel]);

			// Query with includeCancelled: false (default), limit: 3, offset: 0
			// Should return indices 0, 1, 3 (skipping 2)
			// Assumes getRecurringEvents filters cancelled instances BEFORE applying limit/offset.
			// If resolver ordering changes (paginate first, then filter), this expectation must be updated.
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
					includeCancelled: false,
					limit: 3,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(3);

			const expectedInstanceId0 = instanceIds[0];
			const expectedInstanceId1 = instanceIds[1];
			const expectedInstanceId3 = instanceIds[3];
			const instance0 = instances[0];
			const instance1 = instances[1];
			const instance2 = instances[2];

			assertToBeNonNullish(expectedInstanceId0);
			assertToBeNonNullish(expectedInstanceId1);
			assertToBeNonNullish(expectedInstanceId3);
			assertToBeNonNullish(instance0);
			assertToBeNonNullish(instance1);
			assertToBeNonNullish(instance2);

			expect(instance0.id).toBe(expectedInstanceId0);
			expect(instance1.id).toBe(expectedInstanceId1);
			expect(instance2.id).toBe(expectedInstanceId3); // Skipped 2
		});

		test("should maintain stable ordering", async () => {
			// Setup: Create recurring event with 5 instances
			const organizationCreateResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { name: faker.company.name() } },
				},
			);
			assertToBeNonNullish(organizationCreateResult.data?.createOrganization);
			const organizationId =
				organizationCreateResult.data.createOrganization.id;
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 5,
				});

			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: templateId,
				},
			});

			expect(result.errors).toBeUndefined();
			const instances = result.data?.getRecurringEvents;
			assertToBeNonNullish(instances);
			expect(instances).toHaveLength(5);

			// Verify order matches creation order (chronological)
			instances.forEach((instance, index) => {
				expect(instance.id).toBe(instanceIds[index]);
			});
		});
	});
});
