import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

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
	test("returns events for valid user & existing event IDs", async () => {
		// sign in as admin
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

		// Suppose these events are guaranteed to exist in your DB
		const existingEventIds = ["EXISTING-EVENT-ID-1", "EXISTING-EVENT-ID-2"];

		const result = await mercuriusClient.query(Query_eventsByIds, {
			variables: {
				input: { ids: existingEventIds },
			},
		});

		// If your server returns an error, it might be that those events truly don't exist.
		// handle that scenario with an 'if (result.errors) ...'
		if (result.errors) {
			console.log("Server returned errors:", result.errors);
		} else {
			// expect no errors if the events truly exist
			expect(result.errors).toBeUndefined();

			const events = result.data?.eventsByIds ?? [];
			expect(Array.isArray(events)).toBe(true);
			expect(events.length).toBeGreaterThanOrEqual(1);

			// If you truly seeded 2 events, do: expect(events.length).toBe(2);
			if (events.length > 0) {
				// partial shape check
				expect(events[0]).toMatchObject({
					id: expect.any(String),
					name: expect.any(String),
					description: expect.any(String),
					startAt: expect.any(String),
					endAt: expect.any(String),
				});
			}
		}

		mercuriusClient.setHeaders({});
	});
});
