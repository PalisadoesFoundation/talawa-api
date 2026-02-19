import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_registerEventAttendee,
	Query_currentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Mutation field registerEventAttendee", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					variables: {
						data: {
							userId: faker.string.uuid(),
							eventId: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.registerEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["registerEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when neither eventId nor recurringEventInstanceId is provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							// Missing both eventId and recurringEventInstanceId
						},
					},
				},
			);
			expect(result.data?.registerEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									message:
										"Either eventId or recurringEventInstanceId must be provided, but not both",
								}),
							]),
						}),
						path: ["registerEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user to register does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: faker.string.uuid(), // Non-existent user ID
							eventId: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.registerEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "userId"],
								}),
							]),
						}),
						path: ["registerEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId: faker.string.uuid(), // Non-existent event ID
						},
					},
				},
			);
			expect(result.data?.registerEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "eventId"],
								}),
							]),
						}),
						path: ["registerEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the recurring event instance does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							recurringEventInstanceId: faker.string.uuid(), // Non-existent instance ID
						},
					},
				},
			);
			expect(result.data?.registerEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "recurringEventInstanceId"],
								}),
							]),
						}),
						path: ["registerEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when user is not authorized to register attendees", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Register Attendee Unauthorized Test Org ${faker.string.ulid()}`,
							description:
								"Organization for unauthorized register attendee testing",
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
							name: "Unauthorized Register Attendee Test Event",
							description: "Event for unauthorized register attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a regular user (non-admin) and get their auth token
			const { userId: regularUserId, authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserId);
			assertToBeNonNullish(regularUserToken);

			// Create another user to register
			const { userId: userToRegisterId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToRegisterId);

			// Try to register as regular user (should fail with unauthorized_action)
			const result = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						data: {
							userId: userToRegisterId,
							eventId,
						},
					},
				},
			);

			expect(result.data?.registerEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["registerEventAttendee"],
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
							name: `Register Attendee Already Registered Test Org ${faker.string.ulid()}`,
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
							name: "Already Registered Test Event",
							description: "Event for already registered testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Register the user first
			const firstResult = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId,
						},
					},
				},
			);
			expect(firstResult.errors).toBeUndefined();

			// Try to register again (should fail)
			const secondResult = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId,
						},
					},
				},
			);

			expect(secondResult.data?.registerEventAttendee).toBeNull();
			expect(secondResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "userId"],
									message: "User is already registered for this event",
								}),
							]),
						}),
						path: ["registerEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when user is already invited but not registered", () => {
		test("should update the attendee to registered and return the updated record", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Register Attendee Invited Test Org ${faker.string.ulid()}`,
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
							name: "Invited Attendee Test Event",
							description: "Event for invited attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Insert an event attendee record with isInvited = true, isRegistered = false
			await server.drizzleClient.insert(eventAttendeesTable).values({
				userId,
				eventId,
				recurringEventInstanceId: null,
				isInvited: true,
				isRegistered: false,
				isCheckedIn: false,
				isCheckedOut: false,
			});

			// Register the user (should update the existing record)
			const result = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId,
						},
					},
				},
			);

			expect(result.data?.registerEventAttendee).toBeDefined();
			expect(result.data?.registerEventAttendee?.id).toBeDefined();
			expect(result.data?.registerEventAttendee?.isInvited).toBe(true);
			expect(result.data?.registerEventAttendee?.isRegistered).toBe(true);
			expect(result.data?.registerEventAttendee?.isCheckedIn).toBe(false);
			expect(result.data?.registerEventAttendee?.isCheckedOut).toBe(false);
			expect(result.errors).toBeUndefined();
		});
	});

	test("should successfully register the user for the event and return the attendee record", async () => {
		// Create organization and event as admin
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Register Attendee Test Org ${faker.string.ulid()}`,
						description: "Organization for register attendee testing",
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
						name: "Register Attendee Test Event",
						description: "Event for register attendee testing",
						organizationId: orgId,
						startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
						endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create a user
		const { userId } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(userId);

		// Register the user
		const result = await mercuriusClient.mutate(
			Mutation_registerEventAttendee,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId,
					},
				},
			},
		);

		expect(result.data?.registerEventAttendee).toBeDefined();
		expect(result.data?.registerEventAttendee?.id).toBeDefined();
		expect(result.data?.registerEventAttendee?.isRegistered).toBe(true);
		expect(result.data?.registerEventAttendee?.isCheckedIn).toBe(false);
		expect(result.data?.registerEventAttendee?.isCheckedOut).toBe(false);
		expect(result.errors).toBeUndefined();
	});
});
