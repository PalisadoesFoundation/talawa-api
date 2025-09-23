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
	Mutation_deleteEventVolunteer,
	Mutation_deleteEventVolunteerGroup,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
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
	let volunteerGroupId: string;
	let eventVolunteerId: string;

	// Minimal setup to reduce rate limiting - same pattern as getEventVolunteerGroups
	beforeAll(async () => {
		// Add delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 100));

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

		// Add delay between requests
		await new Promise((resolve) => setTimeout(resolve, 200));

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
						name: `Test Membership Org ${faker.string.alphanumeric(6)}`,
					},
				},
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);
		organizationId = orgResult.data.createOrganization.id;

		await new Promise((resolve) => setTimeout(resolve, 200));

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

		await new Promise((resolve) => setTimeout(resolve, 200));

		// Create event
		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Test Membership Event ${faker.string.alphanumeric(4)}`,
					description: "Test event for membership queries",
					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					organizationId,
				},
			},
		});

		assertToBeNonNullish(eventResult.data?.createEvent);
		eventId = eventResult.data.createEvent.id;

		await new Promise((resolve) => setTimeout(resolve, 200));

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
						name: `Test Membership User ${faker.person.firstName()}`,
						password: "password123",
						role: "regular",
					},
				},
			},
		);

		assertToBeNonNullish(regularUserResult.data?.createUser);
		regularUserId = regularUserResult.data.createUser.user?.id as string;

		await new Promise((resolve) => setTimeout(resolve, 200));

		// Create organization membership for regular user
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

		await new Promise((resolve) => setTimeout(resolve, 200));

		// Create volunteer group
		const volunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					data: {
						eventId,
						leaderId: regularUserId, // Use same user as leader
						name: `Test Membership Group ${faker.string.alphanumeric(4)}`,
						description: "Test volunteer group for membership queries",
						volunteersRequired: 3,
					},
				},
			},
		);

		assertToBeNonNullish(volunteerGroupResult.data?.createEventVolunteerGroup);
		volunteerGroupId = volunteerGroupResult.data.createEventVolunteerGroup
			.id as string;

		await new Promise((resolve) => setTimeout(resolve, 200));

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

		await new Promise((resolve) => setTimeout(resolve, 200));

		// Update volunteer to be accepted
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

		await new Promise((resolve) => setTimeout(resolve, 200));

		// Create accepted volunteer membership
		await mercuriusClient.mutate(Mutation_createVolunteerMembership, {
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
		});
	});

	// Comprehensive cleanup - same pattern as getEventVolunteerGroups
	afterAll(async () => {
		try {
			// Delete event volunteers first (they depend on users and events)
			if (eventVolunteerId) {
				try {
					await mercuriusClient.mutate(Mutation_deleteEventVolunteer, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: { id: eventVolunteerId },
					});
				} catch (error) {
					console.warn(`Failed to delete event volunteer: ${error}`);
				}
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Delete volunteer group
			if (volunteerGroupId) {
				try {
					await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: { id: volunteerGroupId },
					});
				} catch (error) {
					console.warn(`Failed to delete volunteer group: ${error}`);
				}
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Delete organization memberships
			if (regularUserId && organizationId) {
				try {
					await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								organizationId,
								memberId: regularUserId,
							},
						},
					});
				} catch (error) {
					console.warn(`Failed to delete regular user membership: ${error}`);
				}
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			if (adminUserId && organizationId) {
				try {
					await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								organizationId,
								memberId: adminUserId,
							},
						},
					});
				} catch (error) {
					console.warn(`Failed to delete admin membership: ${error}`);
				}
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Delete regular user
			if (regularUserId) {
				try {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: { input: { id: regularUserId } },
					});
				} catch (error) {
					console.warn(`Failed to delete regular user: ${error}`);
				}
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Delete organization last
			if (organizationId) {
				try {
					await mercuriusClient.mutate(Mutation_deleteOrganization, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: { input: { id: organizationId } },
					});
				} catch (error) {
					console.warn(`Failed to delete organization: ${error}`);
				}
			}
		} catch (error) {
			console.error("Cleanup failed:", error);
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

		test("should handle invalid orderBy values", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId,
					},
					orderBy: "invalid_order" as "createdAt_ASC" | "createdAt_DESC",
				},
			});

			// GraphQL type validation should catch this before resolver
			expect(result.data).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.message).toContain(
				'Value "invalid_order" does not exist',
			);
		});
	});

	suite("Basic Filtering", () => {
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
	});

	suite("Filter Types - Coverage for individual/group filtering", () => {
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

		test("should create and test individual membership filter", async () => {
			// Create individual volunteer membership (no group)
			const individualMembershipResult = await mercuriusClient.mutate(
				Mutation_createVolunteerMembership,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							userId: regularUserId,
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

			await new Promise((resolve) => setTimeout(resolve, 200));

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
	});

	suite("Text Filtering - Coverage for name/title filtering", () => {
		test("should filter by userName containing text", async () => {
			const userNamePart = "Test Membership User"; // Part of our user's name

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
			const eventTitlePart = "Test Membership Event"; // Part of our event name

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
	});

	suite("Ordering - Coverage for ordering paths", () => {
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
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);
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
			expect(result.data?.getVolunteerMembership?.length).toBeGreaterThan(0);
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
});
