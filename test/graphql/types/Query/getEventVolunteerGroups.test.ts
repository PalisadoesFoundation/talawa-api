import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
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
	Query_getEventVolunteerGroups,
	Query_signIn,
} from "../documentNodes";

suite("Query field getEventVolunteerGroups", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let organizationId: string;
	let eventId: string;
	let regularUserId: string;
	let regularUserAuthToken: string;
	let volunteerGroupId: string;

	// Minimal setup to reduce rate limiting
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
						name: `Test Org ${faker.string.alphanumeric(6)}`,
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
					name: `Test Event ${faker.string.alphanumeric(4)}`,
					description: "Test event",
					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					organizationId,
				},
			},
		});

		assertToBeNonNullish(eventResult.data?.createEvent);
		eventId = eventResult.data.createEvent.id;

		await new Promise((resolve) => setTimeout(resolve, 200));

		// Create one regular user
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
						name: `Test User ${faker.person.firstName()}`,
						password: "password123",
						role: "regular",
					},
				},
			},
		);

		assertToBeNonNullish(regularUserResult.data?.createUser);
		regularUserId = regularUserResult.data.createUser.user?.id as string;
		regularUserAuthToken = regularUserResult.data.createUser
			.authenticationToken as string;

		await new Promise((resolve) => setTimeout(resolve, 200));

		// Create organization membership
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
						leaderId: regularUserId, // Use the same user as leader
						name: `Test Group ${faker.string.alphanumeric(4)}`,
						description: "Test volunteer group",
						volunteersRequired: 5,
					},
				},
			},
		);

		assertToBeNonNullish(volunteerGroupResult.data?.createEventVolunteerGroup);
		volunteerGroupId = volunteerGroupResult.data.createEventVolunteerGroup
			.id as string;
	});

	// Comprehensive cleanup with proper order
	afterAll(async () => {
		try {
			// Delete volunteer group first (depends on event and leader)
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

			// Delete organization memberships (prevents foreign key issues)
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

			// Delete organization last (it may have dependencies)
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
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					variables: {
						where: {
							eventId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);
		});
	});

	suite("Basic Query Functionality", () => {
		test("should return volunteer groups for valid eventId when user is organization admin", async () => {
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventVolunteerGroups).toBeDefined();
			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

			const group = result.data?.getEventVolunteerGroups?.[0];
			expect(group).toHaveProperty("id");
			expect(group).toHaveProperty("name");
			expect(group).toHaveProperty("description");
			expect(group).toHaveProperty("volunteersRequired");
			expect(group).toHaveProperty("leader");
			expect(group).toHaveProperty("event");
			expect(group).toHaveProperty("creator");
			expect(group).toHaveProperty("createdAt");
			expect(group).toHaveProperty("updatedAt");
		});

		test("should throw error for non-existent eventId", async () => {
			const fakeEventId = faker.string.uuid();

			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId: fakeEventId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["where", "eventId"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);
		});

		test("should throw error for invalid eventId format", async () => {
			const invalidEventId = faker.string.alphanumeric(10);

			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId: invalidEventId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["where", "eventId"],
									message: expect.stringContaining("Invalid UUID"),
								}),
							]),
						}),
						message: expect.any(String),
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);
		});
	});

	suite("User Path - Coverage for userId + orgId", () => {
		test("should return groups where user has accepted volunteer memberships", async () => {
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
			const eventVolunteerId = eventVolunteerResult.data.createEventVolunteer
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

			// Create volunteer membership
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

			await new Promise((resolve) => setTimeout(resolve, 200));

			// Test user path query
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${regularUserAuthToken}`,
					},
					variables: {
						where: {
							userId: regularUserId,
							orgId: organizationId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventVolunteerGroups).toBeDefined();
			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

			// Comprehensive cleanup - delete all created resources
			try {
				// VolunteerMemberships are typically auto-deleted when EventVolunteer is deleted
				await mercuriusClient.mutate(Mutation_deleteEventVolunteer, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: eventVolunteerId },
				});
			} catch (error) {
				console.warn(`Failed to cleanup test resources: ${error}`);
			}
		});
	});

	suite("Authorization - Coverage for unauthorized path", () => {
		test("should throw unauthorized error when user is not organization member", async () => {
			// Create a new user not in the organization
			const nonMemberResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							emailAddress: `${faker.string.ulid()}@test.com`,
							isEmailAddressVerified: true,
							name: "Non Member User",
							password: "password123",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(nonMemberResult.data?.createUser);
			const nonMemberAuthToken = nonMemberResult.data.createUser
				.authenticationToken as string;
			const nonMemberUserId = nonMemberResult.data.createUser.user
				?.id as string;

			await new Promise((resolve) => setTimeout(resolve, 200));

			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${nonMemberAuthToken}`,
					},
					variables: {
						where: {
							eventId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthorizedActionExtensions>({
							code: "unauthorized_action",
						}),
						message: expect.any(String),
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);

			// Cleanup non-member user
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: { input: { id: nonMemberUserId } },
			});
		});
	});

	suite("Filtering - Coverage for name filtering paths", () => {
		test("should filter groups by name contains", async () => {
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId,
							name_contains: "Test Group", // Part of our test group name
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventVolunteerGroups).toBeDefined();
			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

			const group = result.data?.getEventVolunteerGroups?.[0];
			expect(group?.name).toContain("Test Group");
		});

		test("should filter groups by leader name", async () => {
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId,
							leaderName: "Test User", // Part of our leader's name
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventVolunteerGroups).toBeDefined();
			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
			expect(result.data?.getEventVolunteerGroups?.length).toBeGreaterThan(0);

			const group = result.data?.getEventVolunteerGroups?.[0];
			expect(group?.leader?.name).toContain("Test User");
		});

		test("should return empty array when name filter matches no groups", async () => {
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId,
							name_contains: "NonExistentGroupName",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventVolunteerGroups).toBeDefined();
			expect(result.data?.getEventVolunteerGroups?.length).toBe(0);
		});
	});

	suite("Ordering", () => {
		test("should handle volunteers_ASC ordering", async () => {
			// Extra long delay since this test runs after many previous tests
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId,
						},
						orderBy: "volunteers_ASC",
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventVolunteerGroups).toBeDefined();
			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
		});

		test("should handle volunteers_DESC ordering", async () => {
			// Extra long delay since this is the last test and rate limits accumulate
			await new Promise((resolve) => setTimeout(resolve, 1200));

			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						where: {
							eventId,
						},
						orderBy: "volunteers_DESC",
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventVolunteerGroups).toBeDefined();
			expect(Array.isArray(result.data?.getEventVolunteerGroups)).toBe(true);
		});
	});
});
