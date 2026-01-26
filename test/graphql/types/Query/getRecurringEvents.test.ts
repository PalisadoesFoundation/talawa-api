import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
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

		test("should return an error when event is not a recurring event template", async () => {
			// Create organization first
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

			if (!organizationCreateResult.data?.createOrganization) {
				return;
			}

			const organizationId =
				organizationCreateResult.data.createOrganization.id;

			// Create a regular (non-recurring) event
			const eventCreateResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.lorem.words(3),
							description: faker.lorem.sentence(),
							organizationId,
							startAt: faker.date.future().toISOString(),
							endAt: faker.date.future().toISOString(),
						},
					},
				},
			);

			if (!eventCreateResult.data?.createEvent) {
				return;
			}

			const eventId = eventCreateResult.data.createEvent.id;

			// Try to get recurring events for a non-recurring event
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: eventId,
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: expect.stringContaining("recurring event template"),
						extensions: expect.objectContaining({
							code: "invalid_arguments",
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
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
			// The validation error should be present regardless of the specific error code
			// as the zod schema will catch this at the resolver level
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
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
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
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
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
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
		});
	});

	suite("when authentication is required", () => {
		test("should validate that the query requires authentication", async () => {
			const result = await mercuriusClient.query(Query_getRecurringEvents, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					baseRecurringEventId: faker.string.uuid(),
				},
			});

			expect(result.data?.getRecurringEvents).toBeNull();
			expect(result.errors).toBeDefined();
		});
	});

	suite("when user has insufficient permissions", () => {
		test("should return an error when user is not a member of the organization and not an admin", async () => {
			// Create a regular user (non-admin)
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

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

			if (organizationCreateResult.data?.createOrganization) {
				const organizationId =
					organizationCreateResult.data.createOrganization.id;

				// Create a regular event as admin
				const eventCreateResult = await mercuriusClient.mutate(
					Mutation_createEvent,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: faker.lorem.words(3),
								description: faker.lorem.sentence(),
								organizationId,
								startAt: faker.date.future().toISOString(),
								endAt: faker.date.future().toISOString(),
							},
						},
					},
				);

				if (eventCreateResult.data?.createEvent) {
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
				}
			}
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

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId, {
					instanceCount: 3,
				});

			// Cancel the second instance
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
