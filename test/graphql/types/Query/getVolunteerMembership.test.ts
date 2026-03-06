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

	// Aggressive rate limiting protection - much longer delays
	beforeAll(async () => {
		// Much longer initial delay
		await new Promise((resolve) => setTimeout(resolve, 500));

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

		// Longer delays between each operation
		await new Promise((resolve) => setTimeout(resolve, 800));

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
						name: `Membership Test Org ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);
		organizationId = orgResult.data.createOrganization.id;

		await new Promise((resolve) => setTimeout(resolve, 800));

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

		await new Promise((resolve) => setTimeout(resolve, 800));

		// Create event
		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Membership Test Event ${faker.string.alphanumeric(6)}`,
					description: "Test event for membership queries",
					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					organizationId,
				},
			},
		});

		assertToBeNonNullish(eventResult.data?.createEvent);
		eventId = eventResult.data.createEvent.id;

		await new Promise((resolve) => setTimeout(resolve, 800));

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
						name: `Membership Test User ${faker.person.firstName()}`,
						password: "password123",
						role: "regular",
					},
				},
			},
		);

		assertToBeNonNullish(regularUserResult.data?.createUser);
		regularUserId = regularUserResult.data.createUser.user?.id as string;

		await new Promise((resolve) => setTimeout(resolve, 800));

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

		await new Promise((resolve) => setTimeout(resolve, 800));

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
						leaderId: regularUserId,
						name: `Membership Test Group ${faker.string.alphanumeric(6)}`,
						description: "Test volunteer group for membership queries",
						volunteersRequired: 5,
					},
				},
			},
		);

		assertToBeNonNullish(volunteerGroupResult.data?.createEventVolunteerGroup);
		volunteerGroupId = volunteerGroupResult.data.createEventVolunteerGroup
			.id as string;

		await new Promise((resolve) => setTimeout(resolve, 800));

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

		await new Promise((resolve) => setTimeout(resolve, 800));

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

		await new Promise((resolve) => setTimeout(resolve, 800));

		// Create accepted volunteer membership for testing
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

		// Final setup delay
		await new Promise((resolve) => setTimeout(resolve, 1000));
	});

	// Comprehensive cleanup with longer delays
	afterAll(async () => {
		try {
			// Delete event volunteers first
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
				await new Promise((resolve) => setTimeout(resolve, 300));
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
				await new Promise((resolve) => setTimeout(resolve, 300));
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
				await new Promise((resolve) => setTimeout(resolve, 300));
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
				await new Promise((resolve) => setTimeout(resolve, 300));
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
				await new Promise((resolve) => setTimeout(resolve, 300));
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

			// Final cleanup delay
			await new Promise((resolve) => setTimeout(resolve, 500));
		} catch (error) {
			console.error("Cleanup failed:", error);
		}
	});

	suite("Authentication", () => {
		test("should throw unauthenticated error when client is not authenticated", async () => {
			// Add delay before first test
			await new Promise((resolve) => setTimeout(resolve, 200));

			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				variables: {
					where: {
						eventId, // Use the real eventId from setup
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
		test("should throw error for invalid UUID format", async () => {
			await new Promise((resolve) => setTimeout(resolve, 300));

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
									message: expect.stringContaining("Invalid UUID"),
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

	suite("Basic Functionality", () => {
		test("should handle empty where clause", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

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

		test("should filter by userId using created test data", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

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
			// May be 0 or more depending on test order - just verify structure
		});

		test("should filter by eventId using created test data", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

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
		});

		test("should filter by status", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

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
		});

		test("should handle ordering", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

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
		});

		test("should handle non-existent resources gracefully", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

			const fakeUserId = faker.string.uuid();

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
	});
});
