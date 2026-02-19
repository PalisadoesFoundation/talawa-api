import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import {
	eventsTable,
	recurrenceRulesTable,
	recurringEventInstancesTable,
} from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_registerForEvent,
	Query_currentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Mutation field registerForEvent", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
				variables: {
					id: faker.string.uuid(),
				},
			});
			expect(result.data?.registerForEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["registerForEvent"],
					}),
				]),
			);
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when id is not a valid UUID", async () => {
			const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: "invalid-id",
				},
			});
			expect(result.data?.registerForEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["id"],
									message: expect.stringContaining("Invalid UUID"),
								}),
							]),
						}),
						path: ["registerForEvent"],
					}),
				]),
			);
		});
	});

	suite("when the event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: faker.string.uuid(), // Non-existent event ID
				},
			});
			expect(result.data?.registerForEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["id"],
								}),
							]),
						}),
						path: ["registerForEvent"],
					}),
				]),
			);
		});
	});

	suite("when the event is not registerable", () => {
		test("should return an error with invalid_arguments code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Register For Event Not Registerable Test Org ${faker.string.ulid()}`,
							description: "Organization for not registerable event testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Not Registerable Event",
							description: "Event that is not registerable",
							organizationId: orgId,
							isRegisterable: false, // Make it not registerable
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Try to register for the non-registerable event
			const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: eventId,
				},
			});

			expect(result.data?.registerForEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["id"],
									message: "Event is not registerable",
								}),
							]),
						}),
						path: ["registerForEvent"],
					}),
				]),
			);
		});
	});

	suite("when user is already registered", () => {
		test("should return an error with invalid_arguments code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Register For Event Already Registered Test Org ${faker.string.ulid()}`,
							description: "Organization for already registered testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Already Registered Event",
							description: "Event for already registered testing",
							organizationId: orgId,
							isRegisterable: true,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Register for the event first
			const firstResult = await mercuriusClient.mutate(
				Mutation_registerForEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: eventId,
					},
				},
			);
			expect(firstResult.errors).toBeUndefined();

			// Try to register again (should fail)
			const secondResult = await mercuriusClient.mutate(
				Mutation_registerForEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: eventId,
					},
				},
			);

			expect(secondResult.data?.registerForEvent).toBeNull();
			expect(secondResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["id"],
									message: "User is already registered for this event",
								}),
							]),
						}),
						path: ["registerForEvent"],
					}),
				]),
			);
		});
	});

	suite("when user is invited but not registered", () => {
		test("should update the existing attendee record to set isRegistered to true", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Register For Event Invited Test Org ${faker.string.ulid()}`,
							description:
								"Organization for invited but not registered testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Invited But Not Registered Event",
							description: "Event for invited but not registered testing",
							organizationId: orgId,
							isRegisterable: true,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Directly create an attendee record with isInvited: true, isRegistered: false
			const { eventAttendeesTable } = await import("~/src/drizzle/schema");
			await server.drizzleClient.insert(eventAttendeesTable).values({
				userId: adminUserId,
				eventId: eventId,
				isInvited: true,
				isRegistered: false,
			});

			// Register for the event (should update the existing record)
			const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: eventId,
				},
			});

			expect(result.data?.registerForEvent).toBeDefined();
			expect(result.data?.registerForEvent?.id).toBeDefined();
			expect(result.data?.registerForEvent?.isRegistered).toBe(true);
			expect(result.data?.registerForEvent?.isCheckedIn).toBe(false);
			expect(result.data?.registerForEvent?.isCheckedOut).toBe(false);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("when registering for a recurring event instance", () => {
		test("should successfully register the current user for the recurring event instance", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Register For Recurring Instance Test Org ${faker.string.ulid()}`,
							description:
								"Organization for recurring instance register testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			// Create a base recurring event directly in the database
			const [baseEvent] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Recurring Register Test Event",
					description: "Base recurring event for register testing",
					organizationId: orgId,
					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
					isRecurringEventTemplate: true,
					isRegisterable: true,
					creatorId: adminUserId,
				})
				.returning({ id: eventsTable.id });
			assertToBeNonNullish(baseEvent);
			const baseEventId = baseEvent.id;

			// Create a recurrence rule
			const [recurrenceRule] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					recurrenceRuleString: "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10",
					frequency: "WEEKLY",
					interval: 1,
					recurrenceStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
					latestInstanceDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
					baseRecurringEventId: baseEventId,
					organizationId: orgId,
					creatorId: adminUserId,
				})
				.returning({ id: recurrenceRulesTable.id });
			assertToBeNonNullish(recurrenceRule);
			const recurrenceRuleId = recurrenceRule.id;

			// Create a recurring event instance
			const [instance] = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values({
					baseRecurringEventId: baseEventId,
					recurrenceRuleId: recurrenceRuleId,
					originalSeriesId: baseEventId,
					originalInstanceStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
					actualStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
					actualEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
					organizationId: orgId,
					sequenceNumber: 1,
					totalCount: 10,
				})
				.returning({ id: recurringEventInstancesTable.id });
			assertToBeNonNullish(instance);
			const instanceId = instance.id;

			// Register for the recurring event instance
			const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: instanceId,
				},
			});

			expect(result.data?.registerForEvent).toBeDefined();
			expect(result.data?.registerForEvent?.id).toBeDefined();
			expect(result.data?.registerForEvent?.isRegistered).toBe(true);
			expect(result.data?.registerForEvent?.isCheckedIn).toBe(false);
			expect(result.data?.registerForEvent?.isCheckedOut).toBe(false);
			expect(result.errors).toBeUndefined();
		});
	});

	suite(
		"when registering for a non-registerable recurring event instance",
		() => {
			test("should return an error with invalid_arguments code", async () => {
				// Create organization and event as admin
				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Non-Registerable Recurring Instance Test Org ${faker.string.ulid()}`,
								description:
									"Organization for non-registerable recurring instance testing",
								countryCode: "us",
								state: "CA",
								city: "Los Angeles",
								postalCode: "90001",
								addressLine1: "123 Sunset Blvd",
								addressLine2: "Suite 200",
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);

				// Add admin as organization member with administrator role
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				});

				// Create a base recurring event that is not registerable
				const [baseEvent] = await server.drizzleClient
					.insert(eventsTable)
					.values({
						name: "Non-Registerable Recurring Test Event",
						description: "Base recurring event that is not registerable",
						organizationId: orgId,
						startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
						endAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
						isRecurringEventTemplate: true,
						isRegisterable: false, // Not registerable
						creatorId: adminUserId,
					})
					.returning({ id: eventsTable.id });
				assertToBeNonNullish(baseEvent);
				const baseEventId = baseEvent.id;

				// Create a recurrence rule
				const [recurrenceRule] = await server.drizzleClient
					.insert(recurrenceRulesTable)
					.values({
						recurrenceRuleString: "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10",
						frequency: "WEEKLY",
						interval: 1,
						recurrenceStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
						latestInstanceDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
						baseRecurringEventId: baseEventId,
						organizationId: orgId,
						creatorId: adminUserId,
					})
					.returning({ id: recurrenceRulesTable.id });
				assertToBeNonNullish(recurrenceRule);
				const recurrenceRuleId = recurrenceRule.id;

				// Create a recurring event instance
				const [instance] = await server.drizzleClient
					.insert(recurringEventInstancesTable)
					.values({
						baseRecurringEventId: baseEventId,
						recurrenceRuleId: recurrenceRuleId,
						originalSeriesId: baseEventId,
						originalInstanceStartTime: new Date(
							Date.now() + 24 * 60 * 60 * 1000,
						),
						actualStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
						actualEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
						organizationId: orgId,
						sequenceNumber: 1,
						totalCount: 10,
					})
					.returning({ id: recurringEventInstancesTable.id });
				assertToBeNonNullish(instance);
				const instanceId = instance.id;

				// Try to register for the non-registerable instance
				const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: instanceId,
					},
				});

				expect(result.data?.registerForEvent).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["id"],
										message: "Event is not registerable",
									}),
								]),
							}),
							path: ["registerForEvent"],
						}),
					]),
				);
			});
		},
	);

	test("should successfully register the current user for the event and return the attendee record", async () => {
		// Create organization and event as admin
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Register For Event Test Org ${faker.string.ulid()}`,
						description: "Organization for register for event testing",
						countryCode: "us",
						state: "CA",
						city: "Los Angeles",
						postalCode: "90001",
						addressLine1: "123 Sunset Blvd",
						addressLine2: "Suite 200",
					},
				},
			},
		);
		if (createOrgResult.errors) {
			console.log("Create org errors:", createOrgResult.errors);
		}
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add admin as organization member with administrator role
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId: orgId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Register For Event Test Event",
						description: "Event for register for event testing",
						organizationId: orgId,
						isRegisterable: true,
						startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
						endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Register for the event
		const result = await mercuriusClient.mutate(Mutation_registerForEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				id: eventId,
			},
		});

		expect(result.data?.registerForEvent).toBeDefined();
		expect(result.data?.registerForEvent?.id).toBeDefined();
		expect(result.data?.registerForEvent?.isRegistered).toBe(true);
		expect(result.data?.registerForEvent?.isCheckedIn).toBe(false);
		expect(result.data?.registerForEvent?.isCheckedOut).toBe(false);
		expect(result.errors).toBeUndefined();
	});
});
