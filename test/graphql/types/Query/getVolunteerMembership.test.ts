import { faker } from "@faker-js/faker";
import {
	afterAll,
	afterEach,
	beforeAll,
	expect,
	suite,
	test,
	vi,
} from "vitest";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";

import { assertToBeNonNullish } from "../../../helpers";
import { createRecurringEventWithInstances } from "../../../helpers/recurringEventTestHelpers";
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

vi.mock("~/src/utilities/leakyBucket", () => ({
	complexityLeakyBucket: vi.fn().mockResolvedValue(true),
}));

suite("Query field getVolunteerMembership", () => {
	const EVENT_NAME_PREFIX = "VolMembershipTestEvent";

	let adminAuthToken: string;
	let adminUserId: string;
	let organizationId: string;
	let eventId: string;
	let regularUserId: string;
	let regularUserName: string;
	let volunteerGroupId: string;
	let eventVolunteerId: string;

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
						name: `Membership Test Org ${faker.string.alphanumeric(8)}`,
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
					name: `${EVENT_NAME_PREFIX} ${faker.string.alphanumeric(6)}`,
					description: "Test event for membership queries",
					startAt: "2027-01-01T10:00:00Z",
					endAt: "2027-01-01T11:00:00Z",
					organizationId,
				},
			},
		});

		assertToBeNonNullish(eventResult.data?.createEvent);
		eventId = eventResult.data.createEvent.id;

		// Create regular user with a unique recognizable name for filtering tests
		regularUserName = `VolMembershipUser ${faker.string.alphanumeric(6)}`;
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
						name: regularUserName,
						password: "password123",
						role: "regular",
					},
				},
			},
		);

		assertToBeNonNullish(regularUserResult.data?.createUser);
		regularUserId = regularUserResult.data.createUser.user?.id as string;

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

		// Create accepted volunteer membership (group membership) for testing
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

	afterEach(() => {
		vi.clearAllMocks();
	});

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
		test("should throw error for invalid UUID in userId field", async () => {
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

		test("should throw error for invalid UUID in eventId field", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventId: "not-a-valid-uuid",
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
									argumentPath: ["where", "eventId"],
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

		test("should throw error for invalid UUID in groupId field", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						groupId: "not-a-valid-uuid",
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
									argumentPath: ["where", "groupId"],
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
		test("should handle empty where clause and return array", async () => {
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

		test("should filter by userId and return matching memberships", async () => {
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
			expect(
				result.data?.getVolunteerMembership?.length,
			).toBeGreaterThanOrEqual(1);
		});

		test("should filter by eventId (non-recurring) and return matching memberships", async () => {
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
			expect(
				result.data?.getVolunteerMembership?.length,
			).toBeGreaterThanOrEqual(1);
		});

		test("should filter by groupId and return matching memberships", async () => {
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
			expect(
				result.data?.getVolunteerMembership?.length,
			).toBeGreaterThanOrEqual(1);

			// All returned memberships should belong to the specified group
			for (const membership of result.data?.getVolunteerMembership ?? []) {
				expect(membership?.group?.id).toBe(volunteerGroupId);
			}
		});

		test("should filter by status and return matching memberships", async () => {
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

		test("should return empty array for non-existent userId", async () => {
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

		test("should return empty array for non-existent groupId", async () => {
			const fakeGroupId = faker.string.uuid();

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
	});

	suite("Filter Type", () => {
		test("should filter group memberships using filter: group (isNotNull groupId)", async () => {
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

			// All returned memberships should have a group (isNotNull groupId)
			for (const membership of result.data?.getVolunteerMembership ?? []) {
				expect(membership?.group).not.toBeNull();
			}
		});

		test("should filter individual memberships using filter: individual (isNull groupId)", async () => {
			let individualVolunteerId: string | undefined;
			try {
				// First create an individual membership (no group)
				const individualEventVolunteerResult = await mercuriusClient.mutate(
					Mutation_createEventVolunteer,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								eventId,
								userId: adminUserId,
							},
						},
					},
				);

				assertToBeNonNullish(
					individualEventVolunteerResult.data?.createEventVolunteer,
				);
				individualVolunteerId = individualEventVolunteerResult.data
					.createEventVolunteer.id as string;

				// Accept the volunteer
				await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						id: individualVolunteerId,
						data: { hasAccepted: true },
					},
				});

				// Create individual membership (no group)
				await mercuriusClient.mutate(Mutation_createVolunteerMembership, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							userId: adminUserId,
							event: eventId,
							status: "accepted",
							// No group field = individual membership
						},
					},
				});

				const result = await mercuriusClient.query(
					Query_getVolunteerMembership,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							where: {
								eventId,
								filter: "individual",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.getVolunteerMembership).toBeDefined();
				expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);

				// All returned memberships should have no group (isNull groupId)
				for (const membership of result.data?.getVolunteerMembership ?? []) {
					expect(membership?.group).toBeNull();
				}
			} finally {
				// Cleanup always runs: deleting the volunteer cascade-deletes its
				// associated memberships (deleteEventVolunteer.ts WHERE volunteerId = id).
				if (individualVolunteerId) {
					await mercuriusClient
						.mutate(Mutation_deleteEventVolunteer, {
							headers: {
								authorization: `bearer ${adminAuthToken}`,
							},
							variables: { id: individualVolunteerId },
						})
						.catch((err: unknown) => {
							console.warn(`Failed to cleanup individual volunteer: ${err}`);
						});
				}
			}
		});
	});

	suite("Ordering", () => {
		test("should order results by createdAt ascending", async () => {
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

			// Verify ascending order: each item's createdAt should be >= previous
			const memberships = result.data?.getVolunteerMembership ?? [];
			for (let i = 1; i < memberships.length; i++) {
				const prevCreatedAt = memberships[i - 1]?.createdAt;
				const currCreatedAt = memberships[i]?.createdAt;
				assertToBeNonNullish(prevCreatedAt);
				assertToBeNonNullish(currCreatedAt);
				const prev = new Date(prevCreatedAt).getTime();
				const curr = new Date(currCreatedAt).getTime();
				expect(curr).toBeGreaterThanOrEqual(prev);
			}
		});

		test("should order results by createdAt descending", async () => {
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

			// Verify descending order: each item's createdAt should be <= previous
			const memberships = result.data?.getVolunteerMembership ?? [];
			for (let i = 1; i < memberships.length; i++) {
				const prevCreatedAt = memberships[i - 1]?.createdAt;
				const currCreatedAt = memberships[i]?.createdAt;
				assertToBeNonNullish(prevCreatedAt);
				assertToBeNonNullish(currCreatedAt);
				const prev = new Date(prevCreatedAt).getTime();
				const curr = new Date(currCreatedAt).getTime();
				expect(curr).toBeLessThanOrEqual(prev);
			}
		});
	});

	suite("Text Filtering", () => {
		test("should filter by userName using partial match (ilike)", async () => {
			// Use a substring of the user's name for the ilike search
			const partialName = regularUserName.split(" ")[0]; // "VolMembershipUser"

			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userName: partialName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(
				result.data?.getVolunteerMembership?.length,
			).toBeGreaterThanOrEqual(1);

			// All returned memberships should have volunteers whose user name matches
			for (const membership of result.data?.getVolunteerMembership ?? []) {
				expect(membership?.volunteer?.user?.name).toContain(partialName);
			}
		});

		test("should return empty array when userName filter matches no users", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						userName: "NonExistentUserNameXYZ987",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBe(0);
		});

		test("should filter by eventTitle using partial match (ilike)", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventTitle: EVENT_NAME_PREFIX,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(
				result.data?.getVolunteerMembership?.length,
			).toBeGreaterThanOrEqual(1);

			// All returned memberships should have events whose name matches
			for (const membership of result.data?.getVolunteerMembership ?? []) {
				expect(membership?.event?.name).toContain(EVENT_NAME_PREFIX);
			}
		});

		test("should return empty array when eventTitle filter matches no events", async () => {
			const result = await mercuriusClient.query(Query_getVolunteerMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					where: {
						eventTitle: "NonExistentEventTitleXYZ987",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.getVolunteerMembership).toBeDefined();
			expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);
			expect(result.data?.getVolunteerMembership?.length).toBe(0);
		});
	});

	suite("Recurring Event Instance Path", () => {
		test("should handle eventId that is a recurring instance (OR condition for instance + series)", async () => {
			let recurringVolunteerId: string | undefined;
			try {
				// Create a recurring event with instances
				const { templateId, instanceIds } =
					await createRecurringEventWithInstances(organizationId, adminUserId, {
						instanceCount: 2,
						startDate: new Date("2027-01-08T10:00:00Z"),
					});

				assertToBeNonNullish(instanceIds[0]);
				const instanceId = instanceIds[0];

				// Create a membership for the base template event (ENTIRE_SERIES case).
				// The mutation defaults scope to ENTIRE_SERIES for recurring templates,
				// so membership.eventId = templateId.
				const membershipResult = await mercuriusClient.mutate(
					Mutation_createVolunteerMembership,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							data: {
								userId: adminUserId,
								event: templateId,
								status: "invited",
							},
						},
					},
				);

				assertToBeNonNullish(
					membershipResult.data?.createVolunteerMembership?.volunteer?.id,
				);
				recurringVolunteerId = membershipResult.data.createVolunteerMembership
					.volunteer.id as string;

				// Query with the recurring instance ID — triggers the OR condition:
				// (source lines 91-106: checks recurringEventInstancesTable, builds
				//  OR for eventId = instanceId OR eventId = baseRecurringEventId)
				const result = await mercuriusClient.query(
					Query_getVolunteerMembership,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							where: {
								eventId: instanceId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.getVolunteerMembership).toBeDefined();
				expect(Array.isArray(result.data?.getVolunteerMembership)).toBe(true);

				// Verify the OR condition: the series/template membership (eventId = templateId)
				// is returned when querying by instanceId — proving the OR branch works
				const seriesMembership = result.data?.getVolunteerMembership?.find(
					(m) => m?.event?.id === templateId,
				);
				expect(seriesMembership).toBeDefined();
			} finally {
				// Cleanup always runs: deleting the volunteer cascade-deletes its memberships.
				// Note: recurring event template and instances are cascade-deleted
				// when the organization is deleted in afterAll.
				if (recurringVolunteerId) {
					await mercuriusClient
						.mutate(Mutation_deleteEventVolunteer, {
							headers: {
								authorization: `bearer ${adminAuthToken}`,
							},
							variables: { id: recurringVolunteerId },
						})
						.catch((err: unknown) => {
							console.warn(`Failed to cleanup recurring volunteer: ${err}`);
						});
				}
			}
		});
	});
});
