import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";

import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createEventVolunteerGroup,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_createVolunteerMembership,
	Mutation_deleteEventVolunteerGroup,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_updateEventVolunteer,
	Query_getVolunteerMembership,
	Query_signIn,
} from "../documentNodes";


suite("Query field getVolunteerMembership", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let organizationId: string;
	let eventId: string;
	let regularUserId: string;
	let leaderUserId: string;
	let volunteerGroupId: string;
	let eventVolunteerId: string;

	// Setup test data
	beforeAll(async () => {
		// Sign in as admin
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data?.signIn?.authenticationToken);
		assertToBeNonNullish(adminSignInResult.data?.signIn?.user?.id);
		adminAuthToken = adminSignInResult.data.signIn.authenticationToken;
		adminUserId = adminSignInResult.data.signIn.user.id;

		// Create organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						countryCode: "us",
						name: `Test Organization ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);
		organizationId = orgResult.data.createOrganization.id;

		// Create organization membership for admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					organizationId,
					memberId: adminUserId,
					role: "administrator",
				},
			},
		});

		// Create event
		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Test Event ${faker.string.alphanumeric(6)}`,
					description: "Test event for volunteer membership queries",
					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					organizationId,
				},
			},
		});

		assertToBeNonNullish(eventResult.data?.createEvent);
		eventId = eventResult.data.createEvent.id;

		// Create regular user
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						emailAddress: `${faker.string.ulid()}@test.com`,
						isEmailAddressVerified: true,
						name: `Regular User ${faker.person.firstName()}`,
						password: "password123",
						role: "regular",
					},
				},
			},
		);

		assertToBeNonNullish(regularUserResult.data?.createUser);
		regularUserId = regularUserResult.data.createUser.user?.id as string;

		// Create leader user
		const leaderUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					isEmailAddressVerified: true,
					name: `Leader User ${faker.person.firstName()}`,
					password: "password123",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(leaderUserResult.data?.createUser);
		leaderUserId = leaderUserResult.data.createUser.user?.id as string;

		// Create organization memberships for regular users
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					organizationId,
					memberId: regularUserId,
					role: "regular",
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					organizationId,
					memberId: leaderUserId,
					role: "regular",
				},
			},
		});

		// Create event volunteer group
		const volunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					data: {
						eventId,
						leaderId: leaderUserId,
						name: `Test Volunteer Group ${faker.string.alphanumeric(6)}`,
						description: "Test volunteer group for membership queries",
						volunteersRequired: 5,
					},
				},
			},
		);

		assertToBeNonNullish(volunteerGroupResult.data?.createEventVolunteerGroup);
		volunteerGroupId = volunteerGroupResult.data.createEventVolunteerGroup
			.id as string;

		// Create event volunteer
		const eventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						eventId,
						userId: regularUserId,
					},
				},
			},
		);

		assertToBeNonNullish(eventVolunteerResult.data?.createEventVolunteer);
		eventVolunteerId = eventVolunteerResult.data.createEventVolunteer
			.id as string;

		// Update event volunteer to be accepted
		await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				id: eventVolunteerId,
				data: {
					hasAccepted: true,
				},
			},
		});

		// Create group volunteer membership
		const volunteerMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					data: {
						userId: regularUserId,
						event: eventId,
						group: volunteerGroupId,
						status: "accepted",
					},
				},
			},
		);

		assertToBeNonNullish(
			volunteerMembershipResult.data?.createVolunteerMembership,
		);

		// Create individual volunteer membership (no group)
		const individualMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					data: {
						userId: leaderUserId,
						event: eventId,
						group: null, // Individual membership
						status: "invited",
					},
				},
			},
		);

		assertToBeNonNullish(
			individualMembershipResult.data?.createVolunteerMembership,
		);
	});

	// Cleanup
	afterAll(async () => {
		try {
			// Clean up in reverse order of creation
			if (volunteerGroupId) {
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: volunteerGroupId },
				});
			}

			if (regularUserId) {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { input: { id: regularUserId } },
				});
			}

			if (leaderUserId) {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { input: { id: leaderUserId } },
				});
			}

			if (organizationId) {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { input: { id: organizationId } },
				});
			}
		} catch (error) {
			console.warn("Cleanup failed:", error);
		}
	});

	suite("Authentication", () => {
		test("should throw unauthenticated error when client is not authenticated", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				variables: {
					where: {
						eventId,
					},
				},
			});

			expect(result.data?.getVolunteerMembership).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["getVolunteerMembership"],
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		test("should handle empty where clause", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
		});

		test("should throw error for invalid UUID format", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userId: "invalid-uuid-format",
					},
				},
			});

			expect(result.data?.getVolunteerMembership).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["where", "userId"],
									message: "Invalid uuid",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["getVolunteerMembership"],
					}),
				]),
			);
		});
	});

	suite("Filtering", () => {
		test("should filter by userId", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userId: regularUserId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships belong to the specified user
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.volunteer?.user?.id).toBe(regularUserId);
			}
		});

		test("should filter by eventId", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships belong to the specified event
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.event?.id).toBe(eventId);
			}
		});

		test("should filter by groupId", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						groupId: volunteerGroupId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships belong to the specified group
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.group?.id).toBe(volunteerGroupId);
			}
		});

		test("should filter by status", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						status: "accepted",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships have the specified status
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.status).toBe("accepted");
			}
		});

		test("should filter by group membership type", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId,
						filter: "group",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships are group memberships
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.group).not.toBeNull();
				expect(membership?.group?.id).toBeDefined();
			}
		});

		test("should filter by individual membership type", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId,
						filter: "individual",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships are individual memberships
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.group).toBeNull();
			}
		});

		test("should filter by userName containing text", async () => {
			const userNamePart = "Regular User"; // Part of the regular user's name

			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userName: userNamePart,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships have users with names containing the text
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.volunteer?.user?.name).toContain(userNamePart);
			}
		});

		test("should filter by eventTitle containing text", async () => {
			const eventTitlePart = "Test Event"; // Part of the event name

			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventTitle: eventTitlePart,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all returned memberships have events with names containing the text
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.event?.name).toContain(eventTitlePart);
			}
		});

		test("should return empty array when no memberships match filters", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userName: "NonExistentUserName",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBe(0);
		});
	});

	suite("Ordering", () => {
		test("should order by createdAt in ascending order", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId,
					},
					orderBy: "createdAt_ASC",
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(1);

			// Verify ascending order
			const memberships = result.data?.getVolunteerMembership || [];
			for (let i = 1; i < memberships.length; i++) {
				const prevDate = new Date(memberships[i - 1]?.createdAt || "");
				const currDate = new Date(memberships[i]?.createdAt || "");
				expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
			}
		});

		test("should order by createdAt in descending order", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId,
					},
					orderBy: "createdAt_DESC",
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(1);

			// Verify descending order
			const memberships = result.data?.getVolunteerMembership || [];
			for (let i = 1; i < memberships.length; i++) {
				const prevDate = new Date(memberships[i - 1]?.createdAt || "");
				const currDate = new Date(memberships[i]?.createdAt || "");
				expect(currDate.getTime()).toBeLessThanOrEqual(prevDate.getTime());
			}
		});
	});

	suite("Complex Filtering", () => {
		test("should handle multiple filters combined", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId,
						status: "accepted",
						filter: "group",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify all conditions are met
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.event?.id).toBe(eventId);
				expect(membership?.status).toBe("accepted");
				expect(membership?.group).not.toBeNull();
			}
		});

		test("should handle userId and groupId filters together", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userId: regularUserId,
						groupId: volunteerGroupId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			// Verify both conditions are met
			for (const membership of result.data?.getVolunteerMembership || []) {
				expect(membership?.volunteer?.user?.id).toBe(regularUserId);
				expect(membership?.group?.id).toBe(volunteerGroupId);
			}
		});
	});

	suite("Data Integrity", () => {
		test("should return complete membership data structure", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userId: regularUserId,
						groupId: volunteerGroupId,
						status: "accepted",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			const membership = result.data?.getVolunteerMembership?.[0];
			expect(membership?.id).toBeDefined();
			expect(membership?.status).toBeDefined();
			expect(membership?.volunteer).toBeDefined();
			expect(membership?.volunteer?.id).toBeDefined();
			expect(membership?.volunteer?.user).toBeDefined();
			expect(membership?.volunteer?.user?.id).toBeDefined();
			expect(membership?.volunteer?.user?.name).toBeDefined();
			expect(membership?.event).toBeDefined();
			expect(membership?.event?.id).toBeDefined();
			expect(membership?.event?.name).toBeDefined();
			expect(membership?.group).toBeDefined();
			expect(membership?.group?.id).toBeDefined();
			expect(membership?.group?.name).toBeDefined();
			expect(membership?.createdAt).toBeDefined();
		});

		test("should handle null group for individual memberships", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userId: leaderUserId,
						filter: "individual",
						status: "invited",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);

			const membership = result.data?.getVolunteerMembership?.[0];
			expect(membership?.id).toBeDefined();
			expect(membership?.status).toBeDefined();
			expect(membership?.volunteer).toBeDefined();
			expect(membership?.event).toBeDefined();
			expect(membership?.group).toBeNull(); // Individual membership has no group
			expect(membership?.createdAt).toBeDefined();
		});
	});

	suite("Edge Cases", () => {
		test("should handle non-existent eventId gracefully", async () => {
			const fakeEventId = "01234567-89ab-cdef-0123-456789abcdef";

			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId: fakeEventId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBe(0);
		});

		test("should handle non-existent userId gracefully", async () => {
			const fakeUserId = "01234567-89ab-cdef-0123-456789abcdef";

			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userId: fakeUserId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBe(0);
		});

		test("should handle non-existent groupId gracefully", async () => {
			const fakeGroupId = "01234567-89ab-cdef-0123-456789abcdef";

			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						groupId: fakeGroupId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBe(0);
		});

		test("should handle concurrent requests correctly", async () => {
			const promises = Array(5)
				.fill(null)
				.map(() =>
					mercuriusClient.query(Query_getVolunteerMembership, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							where: {
								eventId,
							},
						},
					}),
				);

			const results = await Promise.all(promises);

			for (const result of results) {
				expect(result.errors).toBeUndefined();
				expect(result.data?.getVolunteerMembership).toBeDefined();
				expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			}
		});
	});
});
