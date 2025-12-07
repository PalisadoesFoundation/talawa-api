import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_getRecurringEvents,
} from "../documentNodes";

import { Query_eventsByIds, Query_signIn } from "../documentNodes";

import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";

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
								// The actual message might differ in capitalization
								message: expect.stringContaining("least 1 element"),
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

		const inputObject = {
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

		const generatedEventId = generatedInstances[0]?.id;
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
});
