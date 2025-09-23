// import { faker } from "@faker-js/faker";
// import { afterAll, beforeAll, expect, suite, test } from "vitest";
// import type {
// 	ArgumentsAssociatedResourcesNotFoundExtensions,
// 	InvalidArgumentsExtensions,
// 	TalawaGraphQLFormattedError,
// 	UnauthenticatedExtensions,
// 	UnauthorizedActionExtensions,
// } from "~/src/utilities/TalawaGraphQLError";

// import { assertToBeNonNullish } from "../../../helpers";
// import { server } from "../../../server";
// import { mercuriusClient } from "../client";
// import {
// 	Mutation_createEvent,
// 	Mutation_createEventVolunteer,
// 	Mutation_createEventVolunteerGroup,
// 	Mutation_createOrganization,
// 	Mutation_createOrganizationMembership,
// 	Mutation_createUser,
// 	Mutation_createVolunteerMembership,
// 	Mutation_deleteEventVolunteer,
// 	Mutation_deleteEventVolunteerGroup,
// 	Mutation_deleteOrganization,
// 	Mutation_deleteUser,
// 	Mutation_updateEventVolunteer,
// 	Query_getEventVolunteerGroups,
// 	Query_signIn,
// } from "../documentNodes";

// suite("Query field getEventVolunteerGroups", () => {
// 	let adminAuthToken: string;
// 	let adminUserId: string;
// 	let organizationId: string;
// 	let eventId: string;
// 	let regularUserId: string;
// 	let regularUserAuthToken: string;
// 	let leaderUserId: string;
// 	let leaderUserAuthToken: string;
// 	let volunteerGroupId: string;
// 	let eventVolunteerId: string;
// 	let volunteerMembershipId: string;

// 	// Setup test data
// 	beforeAll(async () => {
// 		// Sign in as admin
// 		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
// 			variables: {
// 				input: {
// 					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
// 					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
// 				},
// 			},
// 		});

// 		assertToBeNonNullish(adminSignInResult.data?.signIn?.authenticationToken);
// 		assertToBeNonNullish(adminSignInResult.data?.signIn?.user?.id);
// 		adminAuthToken = adminSignInResult.data.signIn.authenticationToken;
// 		adminUserId = adminSignInResult.data.signIn.user.id;

// 		// Create organization
// 		const orgResult = await mercuriusClient.mutate(
// 			Mutation_createOrganization,
// 			{
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					input: {
// 						countryCode: "us",
// 						name: `Test Organization ${faker.string.alphanumeric(8)}`,
// 					},
// 				},
// 			},
// 		);

// 		assertToBeNonNullish(orgResult.data?.createOrganization);
// 		organizationId = orgResult.data.createOrganization.id;

// 		// Create organization membership for admin
// 		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
// 			headers: {
// 				authorization: `bearer ${adminAuthToken}`,
// 			},
// 			variables: {
// 				input: {
// 					organizationId,
// 					memberId: adminUserId,
// 					role: "administrator",
// 				},
// 			},
// 		});

// 		// Create event
// 		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
// 			headers: {
// 				authorization: `bearer ${adminAuthToken}`,
// 			},
// 			variables: {
// 				input: {
// 					name: `Test Event ${faker.string.alphanumeric(6)}`,
// 					description: "Test event for volunteer groups",
// 					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
// 					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
// 					organizationId,
// 				},
// 			},
// 		});

// 		assertToBeNonNullish(eventResult.data?.createEvent);
// 		eventId = eventResult.data.createEvent.id;

// 		// Create regular user
// 		const regularUserResult = await mercuriusClient.mutate(
// 			Mutation_createUser,
// 			{
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					input: {
// 						emailAddress: `${faker.string.ulid()}@test.com`,
// 						isEmailAddressVerified: true,
// 						name: `Regular User ${faker.person.firstName()}`,
// 						password: "password123",
// 						role: "regular",
// 					},
// 				},
// 			},
// 		);

// 		assertToBeNonNullish(regularUserResult.data?.createUser);
// 		regularUserId = regularUserResult.data.createUser.user?.id as string;
// 		regularUserAuthToken = regularUserResult.data.createUser
// 			.authenticationToken as string;

// 		// Create leader user
// 		const leaderUserResult = await mercuriusClient.mutate(Mutation_createUser, {
// 			headers: {
// 				authorization: `bearer ${adminAuthToken}`,
// 			},
// 			variables: {
// 				input: {
// 					emailAddress: `${faker.string.ulid()}@test.com`,
// 					isEmailAddressVerified: true,
// 					name: `Leader User ${faker.person.firstName()}`,
// 					password: "password123",
// 					role: "regular",
// 				},
// 			},
// 		});

// 		assertToBeNonNullish(leaderUserResult.data?.createUser);
// 		leaderUserId = leaderUserResult.data.createUser.user?.id as string;
// 		leaderUserAuthToken = leaderUserResult.data.createUser
// 			.authenticationToken as string;

// 		// Create organization memberships for regular users
// 		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
// 			headers: {
// 				authorization: `bearer ${adminAuthToken}`,
// 			},
// 			variables: {
// 				input: {
// 					organizationId,
// 					memberId: regularUserId,
// 					role: "regular",
// 				},
// 			},
// 		});

// 		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
// 			headers: {
// 				authorization: `bearer ${adminAuthToken}`,
// 			},
// 			variables: {
// 				input: {
// 					organizationId,
// 					memberId: leaderUserId,
// 					role: "regular",
// 				},
// 			},
// 		});

// 		// Create event volunteer group with leader
// 		const volunteerGroupResult = await mercuriusClient.mutate(
// 			Mutation_createEventVolunteerGroup,
// 			{
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					data: {
// 						eventId,
// 						leaderId: leaderUserId,
// 						name: `Test Volunteer Group ${faker.string.alphanumeric(6)}`,
// 						description: "Test volunteer group for integration tests",
// 						volunteersRequired: 5,
// 					},
// 				},
// 			},
// 		);

// 		assertToBeNonNullish(volunteerGroupResult.data?.createEventVolunteerGroup);
// 		volunteerGroupId = volunteerGroupResult.data.createEventVolunteerGroup
// 			.id as string;

// 		// Create event volunteer
// 		const eventVolunteerResult = await mercuriusClient.mutate(
// 			Mutation_createEventVolunteer,
// 			{
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					input: {
// 						eventId,
// 						userId: regularUserId,
// 					},
// 				},
// 			},
// 		);

// 		assertToBeNonNullish(eventVolunteerResult.data?.createEventVolunteer);
// 		eventVolunteerId = eventVolunteerResult.data.createEventVolunteer
// 			.id as string;

// 		// Update event volunteer to be accepted
// 		await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
// 			headers: {
// 				authorization: `bearer ${adminAuthToken}`,
// 			},
// 			variables: {
// 				id: eventVolunteerId,
// 				data: {
// 					hasAccepted: true,
// 				},
// 			},
// 		});

// 		// Create volunteer membership linking the user to the group
// 		const volunteerMembershipResult = await mercuriusClient.mutate(
// 			Mutation_createVolunteerMembership,
// 			{
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					data: {
// 						userId: regularUserId, // Use userId as per the input schema
// 						event: eventId,
// 						group: volunteerGroupId,
// 						status: "accepted", // This should work since we specify accepted status
// 					},
// 				},
// 			},
// 		);

// 		assertToBeNonNullish(
// 			volunteerMembershipResult.data?.createVolunteerMembership,
// 		);
// 		volunteerMembershipId = volunteerMembershipResult.data
// 			.createVolunteerMembership.id as string;
// 	});

// 	// Cleanup
// 	afterAll(async () => {
// 		try {
// 			// Clean up in reverse order of creation
// 			if (volunteerMembershipId) {
// 				await mercuriusClient.mutate(Mutation_deleteEventVolunteer, {
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: { id: eventVolunteerId },
// 				});
// 			}

// 			if (volunteerGroupId) {
// 				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: { id: volunteerGroupId },
// 				});
// 			}

// 			if (eventId) {
// 				// Note: Event cleanup would be handled by a delete event mutation if available
// 			}

// 			if (regularUserId) {
// 				await mercuriusClient.mutate(Mutation_deleteUser, {
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: { input: { id: regularUserId } },
// 				});
// 			}

// 			if (leaderUserId) {
// 				await mercuriusClient.mutate(Mutation_deleteUser, {
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: { input: { id: leaderUserId } },
// 				});
// 			}

// 			if (organizationId) {
// 				await mercuriusClient.mutate(Mutation_deleteOrganization, {
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: { input: { id: organizationId } },
// 				});
// 			}
// 		} catch (error) {
// 			console.warn("Cleanup failed:", error);
// 		}
// 	});

// 	suite("Authentication and Authorization", () => {
// 		test("should throw unauthenticated error when client is not authenticated", async () => {
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					variables: {
// 						where: {
// 							eventId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.data?.getEventVolunteerGroups).toBeNull();
// 			expect(result.errors).toEqual(
// 				expect.arrayContaining<TalawaGraphQLFormattedError>([
// 					expect.objectContaining<TalawaGraphQLFormattedError>({
// 						extensions: expect.objectContaining<UnauthenticatedExtensions>({
// 							code: "unauthenticated",
// 						}),
// 						message: expect.any(String),
// 						path: ["getEventVolunteerGroups"],
// 					}),
// 				]),
// 			);
// 		});

// 		test("should throw unauthorized error when user is not organization admin or event creator", async () => {
// 			// Create a new user who is not a member of the organization
// 			const nonMemberUserResult = await mercuriusClient.mutate(
// 				Mutation_createUser,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						input: {
// 							emailAddress: `${faker.string.ulid()}@test.com`,
// 							isEmailAddressVerified: true,
// 							name: "Non Member User",
// 							password: "password123",
// 							role: "regular",
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(nonMemberUserResult.data?.createUser);
// 			const nonMemberAuthToken = nonMemberUserResult.data.createUser
// 				.authenticationToken as string;
// 			const nonMemberUserId = nonMemberUserResult.data.createUser.user
// 				?.id as string;

// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${nonMemberAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.data?.getEventVolunteerGroups).toBeNull();
// 			expect(result.errors).toEqual(
// 				expect.arrayContaining<TalawaGraphQLFormattedError>([
// 					expect.objectContaining<TalawaGraphQLFormattedError>({
// 						extensions: expect.objectContaining<UnauthorizedActionExtensions>({
// 							code: "unauthorized_action",
// 						}),
// 						message: expect.any(String),
// 						path: ["getEventVolunteerGroups"],
// 					}),
// 				]),
// 			);

// 			// Cleanup
// 			await mercuriusClient.mutate(Mutation_deleteUser, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: { input: { id: nonMemberUserId } },
// 			});
// 		});
// 	});

// 	suite("Admin Path - Event-based Queries", () => {
// 		test("should return volunteer groups for valid eventId when user is organization admin", async () => {
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
// 			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

// 			const group = result.data?.getEventVolunteerGroups?.[0];
// 			expect(group).toHaveProperty("id");
// 			expect(group).toHaveProperty("name");
// 			expect(group).toHaveProperty("description");
// 			expect(group).toHaveProperty("volunteersRequired");
// 			expect(group).toHaveProperty("leader");
// 			expect(group).toHaveProperty("event");
// 			expect(group).toHaveProperty("creator");
// 			expect(group).toHaveProperty("createdAt");
// 			expect(group).toHaveProperty("updatedAt");
// 		});

// 		test("should return volunteer groups when user is event creator", async () => {
// 			// Create event with regular user as creator
// 			const userEventResult = await mercuriusClient.mutate(
// 				Mutation_createEvent,
// 				{
// 					headers: {
// 						authorization: `bearer ${regularUserAuthToken}`,
// 					},
// 					variables: {
// 						input: {
// 							name: `User Event ${faker.string.alphanumeric(6)}`,
// 							description: "Event created by regular user",
// 							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
// 							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
// 							organizationId,
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(userEventResult.data?.createEvent);
// 			const userEventId = userEventResult.data.createEvent.id;

// 			// Create volunteer group for this event
// 			const userGroupResult = await mercuriusClient.mutate(
// 				Mutation_createEventVolunteerGroup,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						data: {
// 							eventId: userEventId,
// 							leaderId: leaderUserId,
// 							name: `User Event Group ${faker.string.alphanumeric(6)}`,
// 							description: "Group for user-created event",
// 							volunteersRequired: 3,
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(userGroupResult.data?.createEventVolunteerGroup);
// 			const userGroupId = userGroupResult.data.createEventVolunteerGroup.id;

// 			// Regular user (event creator) should be able to access groups
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${regularUserAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId: userEventId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

// 			// Cleanup
// 			await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: { id: userGroupId as string },
// 			});

// 			// Note: Delete event mutation would be handled by cleanup if available
// 		});

// 		test("should throw error for non-existent eventId", async () => {
// 			// Use a valid UUID format but non-existent ID
// 			const fakeEventId = "01234567-89ab-cdef-0123-456789abcdef";

// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId: fakeEventId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.data?.getEventVolunteerGroups).toBeNull();
// 			expect(result.errors).toEqual(
// 				expect.arrayContaining<TalawaGraphQLFormattedError>([
// 					expect.objectContaining<TalawaGraphQLFormattedError>({
// 						extensions:
// 							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
// 								{
// 									code: "arguments_associated_resources_not_found",
// 									issues: expect.arrayContaining([
// 										expect.objectContaining({
// 											argumentPath: ["where", "eventId"],
// 										}),
// 									]),
// 								},
// 							),
// 						message: expect.any(String),
// 						path: ["getEventVolunteerGroups"],
// 					}),
// 				]),
// 			);
// 		});

// 		test("should throw error for invalid eventId format", async () => {
// 			const invalidEventId = faker.string.alphanumeric(10); // Invalid UUID format

// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId: invalidEventId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.data?.getEventVolunteerGroups).toBeNull();
// 			expect(result.errors).toEqual(
// 				expect.arrayContaining<TalawaGraphQLFormattedError>([
// 					expect.objectContaining<TalawaGraphQLFormattedError>({
// 						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
// 							code: "invalid_arguments",
// 							issues: expect.arrayContaining([
// 								expect.objectContaining({
// 									argumentPath: ["where", "eventId"],
// 									message: "Invalid uuid",
// 								}),
// 							]),
// 						}),
// 						message: expect.any(String),
// 						path: ["getEventVolunteerGroups"],
// 					}),
// 				]),
// 			);
// 		});
// 	});

// 	suite("User Path - User-based Queries", () => {
// 		test("should return groups where user has accepted volunteer memberships", async () => {
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${regularUserAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							userId: regularUserId,
// 							orgId: organizationId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
// 			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

// 			// Verify the returned group is the one the user is a member of
// 			const group = result.data?.getEventVolunteerGroups?.[0];
// 			expect(group?.id).toBe(volunteerGroupId);
// 		});

// 		test("should return empty array when user has no accepted volunteer memberships", async () => {
// 			// Create a new user with no volunteer memberships
// 			const newUserResult = await mercuriusClient.mutate(Mutation_createUser, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					input: {
// 						emailAddress: `${faker.string.ulid()}@test.com`,
// 						isEmailAddressVerified: true,
// 						name: "New User",
// 						password: "password123",
// 						role: "regular",
// 					},
// 				},
// 			});

// 			assertToBeNonNullish(newUserResult.data?.createUser);
// 			const newUserId = newUserResult.data.createUser.user?.id as string;
// 			const newUserAuthToken = newUserResult.data.createUser
// 				.authenticationToken as string;

// 			// Create organization membership for new user
// 			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					input: {
// 						organizationId,
// 						memberId: newUserId,
// 						role: "regular",
// 					},
// 				},
// 			});

// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${newUserAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							userId: newUserId,
// 							orgId: organizationId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
// 			expect(result.data?.getEventVolunteerGroups?.length).toBe(0);

// 			// Cleanup
// 			await mercuriusClient.mutate(Mutation_deleteUser, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: { input: { id: newUserId } },
// 			});
// 		});
// 	});

// 	suite("Filtering Options", () => {
// 		test("should filter groups by name contains", async () => {
// 			// Create another group with a specific name
// 			const specificGroupResult = await mercuriusClient.mutate(
// 				Mutation_createEventVolunteerGroup,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						data: {
// 							eventId,
// 							leaderId: leaderUserId,
// 							name: "SpecificFilterGroup",
// 							description: "Group for name filtering test",
// 							volunteersRequired: 2,
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(specificGroupResult.data?.createEventVolunteerGroup);
// 			const specificGroupId =
// 				specificGroupResult.data.createEventVolunteerGroup.id;

// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 							name_contains: "SpecificFilter",
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(result.data?.getEventVolunteerGroups?.length).toBe(1);
// 			expect(result.data?.getEventVolunteerGroups?.[0]?.name).toContain(
// 				"SpecificFilter",
// 			);

// 			// Cleanup
// 			await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: { id: specificGroupId as string },
// 			});
// 		});

// 		test("should filter groups by leader name", async () => {
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 							leaderName: "Leader User", // Part of the leader's name
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

// 			// Verify the leader matches the filter
// 			const group = result.data?.getEventVolunteerGroups?.[0];
// 			expect(group?.leader?.name).toContain("Leader User");
// 		});

// 		test("should return empty array when name filter matches no groups", async () => {
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 							name_contains: "NonExistentGroupName",
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(result.data?.getEventVolunteerGroups?.length).toBe(0);
// 		});
// 	});

// 	suite("Input Validation", () => {
// 		test("should handle empty where clause correctly", async () => {
// 			// Empty where clause may be valid if no specific filters are required
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							// Empty where clause - depends on implementation if this is valid
// 						},
// 					},
// 				},
// 			);

// 			// This may either return results or throw an error depending on implementation
// 			// Let's check both cases
// 			if (result.errors) {
// 				expect(result.data?.getEventVolunteerGroups).toBeNull();
// 				expect(result.errors).toEqual(
// 					expect.arrayContaining<TalawaGraphQLFormattedError>([
// 						expect.objectContaining<TalawaGraphQLFormattedError>({
// 							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
// 								code: "invalid_arguments",
// 								issues: expect.any(Array),
// 							}),
// 							message: expect.any(String),
// 							path: ["getEventVolunteerGroups"],
// 						}),
// 					]),
// 				);
// 			} else {
// 				// If no errors, should return array (may be empty)
// 				expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 				expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
// 			}
// 		});
// 	});

// 	suite("Order By Functionality", () => {
// 		test("should handle volunteers_ASC ordering", async () => {
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 						},
// 						orderBy: "volunteers_ASC",
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
// 		});

// 		test("should handle volunteers_DESC ordering", async () => {
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 						},
// 						orderBy: "volunteers_DESC",
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
// 		});
// 	});

// 	suite("Complex Scenarios", () => {
// 		test("should handle concurrent requests correctly", async () => {
// 			const promises = Array(5)
// 				.fill(null)
// 				.map(() =>
// 					mercuriusClient.query(Query_getEventVolunteerGroups, {
// 						headers: {
// 							authorization: `bearer ${adminAuthToken}`,
// 						},
// 						variables: {
// 							where: {
// 								eventId,
// 							},
// 						},
// 					}),
// 				);

// 			const results = await Promise.all(promises);

// 			for (const result of results) {
// 				expect(result.errors).toBeUndefined();
// 				expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 				expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
// 			}
// 		});

// 		test("should handle mixed user and admin queries", async () => {
// 			// Admin query
// 			const adminResult = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							eventId,
// 						},
// 					},
// 				},
// 			);

// 			// User query
// 			const userResult = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${regularUserAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							userId: regularUserId,
// 							orgId: organizationId,
// 						},
// 					},
// 				},
// 			);

// 			expect(adminResult.errors).toBeUndefined();
// 			expect(userResult.errors).toBeUndefined();
// 			expect(adminResult.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(userResult.data?.getEventVolunteerGroups).toBeDefined();
// 		});

// 		test("should handle case where user has memberships in multiple groups", async () => {
// 			// Create another group and membership
// 			const secondGroupResult = await mercuriusClient.mutate(
// 				Mutation_createEventVolunteerGroup,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						data: {
// 							eventId,
// 							leaderId: leaderUserId,
// 							name: `Second Group ${faker.string.alphanumeric(6)}`,
// 							description: "Second group for testing",
// 							volunteersRequired: 3,
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(secondGroupResult.data?.createEventVolunteerGroup);
// 			const secondGroupId = secondGroupResult.data.createEventVolunteerGroup.id;

// 			// Create second membership for the same user (regular user can be in multiple groups)
// 			const secondMembershipResult = await mercuriusClient.mutate(
// 				Mutation_createVolunteerMembership,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						data: {
// 							userId: regularUserId, // Same user, different group
// 							event: eventId,
// 							group: secondGroupId,
// 							status: "accepted",
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(
// 				secondMembershipResult.data?.createVolunteerMembership,
// 			);

// 			// Query user's groups - should return both groups
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${regularUserAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							userId: regularUserId,
// 							orgId: organizationId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(result.data?.getEventVolunteerGroups?.length).toBe(2);

// 			// Cleanup second group
// 			await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: { id: secondGroupId as string },
// 			});
// 		});
// 	});

// 	suite("Security Tests", () => {
// 		test("should only return groups with accepted volunteer memberships in user path", async () => {
// 			// Create a group membership with 'invited' status
// 			const invitedGroupResult = await mercuriusClient.mutate(
// 				Mutation_createEventVolunteerGroup,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						data: {
// 							eventId,
// 							leaderId: leaderUserId,
// 							name: `Invited Group ${faker.string.alphanumeric(6)}`,
// 							description: "Group for invited membership test",
// 							volunteersRequired: 2,
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(invitedGroupResult.data?.createEventVolunteerGroup);
// 			const invitedGroupId = invitedGroupResult.data.createEventVolunteerGroup
// 				.id as string;

// 			// Create invited membership (should not appear in results)
// 			await mercuriusClient.mutate(Mutation_createVolunteerMembership, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					data: {
// 						userId: regularUserId, // Same user, different group with invited status
// 						event: eventId,
// 						group: invitedGroupId,
// 						status: "invited",
// 					},
// 				},
// 			});

// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${regularUserAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							userId: regularUserId,
// 							orgId: organizationId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();

// 			// Should only include groups with accepted memberships
// 			const groupIds =
// 				result.data?.getEventVolunteerGroups?.map(
// 					(g: { id: string | null }) => g?.id,
// 				) || [];
// 			expect(groupIds).toContain(volunteerGroupId);
// 			expect(groupIds).not.toContain(invitedGroupId);

// 			// Cleanup
// 			await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: { id: invitedGroupId },
// 			});
// 		});

// 		test("should only return groups where volunteer hasAccepted is true in user path", async () => {
// 			// Create new volunteer who hasn't accepted
// 			const pendingVolunteerResult = await mercuriusClient.mutate(
// 				Mutation_createEventVolunteer,
// 				{
// 					headers: {
// 						authorization: `bearer ${adminAuthToken}`,
// 					},
// 					variables: {
// 						input: {
// 							eventId,
// 							userId: leaderUserId,
// 						},
// 					},
// 				},
// 			);

// 			assertToBeNonNullish(pendingVolunteerResult.data?.createEventVolunteer);
// 			const pendingVolunteerId = pendingVolunteerResult.data
// 				.createEventVolunteer.id as string;

// 			// Create group membership for pending volunteer
// 			await mercuriusClient.mutate(Mutation_createVolunteerMembership, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: {
// 					data: {
// 						userId: leaderUserId, // Link to leader user
// 						event: eventId,
// 						group: volunteerGroupId,
// 						status: "accepted",
// 					},
// 				},
// 			});

// 			// Leader user query should not return groups because they haven't accepted volunteering
// 			const result = await mercuriusClient.query(
// 				Query_getEventVolunteerGroups,
// 				{
// 					headers: {
// 						authorization: `bearer ${leaderUserAuthToken}`,
// 					},
// 					variables: {
// 						where: {
// 							userId: leaderUserId,
// 							orgId: organizationId,
// 						},
// 					},
// 				},
// 			);

// 			expect(result.errors).toBeUndefined();
// 			expect(result.data?.getEventVolunteerGroups).toBeDefined();
// 			expect(result.data?.getEventVolunteerGroups?.length).toBe(0);

// 			// Cleanup
// 			await mercuriusClient.mutate(Mutation_deleteEventVolunteer, {
// 				headers: {
// 					authorization: `bearer ${adminAuthToken}`,
// 				},
// 				variables: { id: pendingVolunteerId },
// 			});
// 		});
// 	});
// });
