import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createAgendaFolder,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteAgendaFolder,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteStandaloneEvent,
	Mutation_deleteUser,
	Query_agendaFolder,
	Query_agendaFolder_Restricted,
	Query_signIn,
} from "../documentNodes";

const EVENT_START_AT = "2027-01-01T10:00:00Z";
const EVENT_END_AT = "2027-01-01T12:00:00Z";

suite("Query field agendaFolder", () => {
	const createdUserIds: string[] = [];
	const createdOrganizationIds: string[] = [];
	const createdEventIds: string[] = [];
	const createdAgendaFolderIds: string[] = [];
	const createdMemberships: { organizationId: string; memberId: string }[] = [];

	afterEach(async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (!adminToken) return;

		// Cleanup in reverse order of creation dependencies
		for (const id of createdAgendaFolderIds.reverse()) {
			try {
				await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id } },
				});
			} catch (error) {
				console.warn("Best effort cleanup failed for agenda folder: ", error);
			}
		}
		createdAgendaFolderIds.length = 0;

		for (const id of createdEventIds.reverse()) {
			try {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id } },
				});
			} catch (error) {
				console.warn("Best effort cleanup failed for event: ", error);
			}
		}
		createdEventIds.length = 0;

		for (const { organizationId, memberId } of createdMemberships.reverse()) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { organizationId, memberId } },
				});
			} catch (error) {
				console.warn("Best effort cleanup failed for membership: ", error);
			}
		}
		createdMemberships.length = 0;

		for (const id of createdOrganizationIds.reverse()) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id } },
				});
			} catch (error) {
				console.warn("Best effort cleanup failed for organization: ", error);
			}
		}
		createdOrganizationIds.length = 0;

		for (const id of createdUserIds.reverse()) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id } },
				});
			} catch (error) {
				console.warn("Best effort cleanup failed for user: ", error);
			}
		}
		createdUserIds.length = 0;
	});

	test("results in a graphql error with 'invalid_arguments' if an invalid id is provided", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		const agendaFolderResult = await mercuriusClient.query(Query_agendaFolder, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: "invalid-id", // Not a valid UUID
				},
			},
		});

		expect(agendaFolderResult.data.agendaFolder).toEqual(null);
		expect(agendaFolderResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["agendaFolder"],
				}),
			]),
		);
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.agendaFolder" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const agendaFolderResult = await mercuriusClient.query(
					Query_agendaFolder,
					{
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);
				expect(agendaFolderResult.data.agendaFolder).toEqual(null);
				expect(agendaFolderResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["agendaFolder"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation is authenticated but the user does not exist in the database", async () => {
				// Step 1: Admin Sign-in
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
				if (!adminToken) throw new Error("Admin authentication failed");

				// Step 2: Create Regular User
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `${faker.string.uuid()}@test.com`,
								password: "password123",
								name: "Regular User",
								role: "regular",
								isEmailAddressVerified: true,
							},
						},
					},
				);

				const regularUserId = regularUserResult.data?.createUser?.user?.id;
				const regularUserToken =
					regularUserResult.data?.createUser?.authenticationToken;

				if (!regularUserId || !regularUserToken)
					throw new Error("Regular user creation failed");
				createdUserIds.push(regularUserId);

				// Step 3: Delete Regular User
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminToken}`,
					},
					variables: {
						input: {
							id: regularUserId,
						},
					},
				});

				// Step 4: Attempt to Query Agenda Folder with Deleted User Token
				const agendaFolderResult = await mercuriusClient.query(
					Query_agendaFolder,
					{
						headers: {
							authorization: `bearer ${regularUserToken}`,
						},
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				expect(agendaFolderResult.data.agendaFolder).toEqual(null);
				expect(agendaFolderResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["agendaFolder"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.agendaFolder" field if`,
		() => {
			test("the specified agenda folder does not exist", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const agendaFolderResult = await mercuriusClient.query(
					Query_agendaFolder,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				expect(agendaFolderResult.data.agendaFolder).toEqual(null);
				expect(agendaFolderResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["agendaFolder"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.agendaFolder" field if`,
		() => {
			test("regular user tries to access agenda folder without organization membership", async () => {
				// Step 1: Admin Sign-in
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
				if (!adminToken) throw new Error("Admin authentication failed");

				// Step 2: Create Regular User
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `${faker.string.uuid()}@test.com`,
								password: "password123",
								name: "Regular User",
								role: "regular",
								isEmailAddressVerified: true,
							},
						},
					},
				);

				const regularUserToken =
					regularUserResult.data?.createUser?.authenticationToken;
				const regularUserId = regularUserResult.data?.createUser?.user?.id;
				if (!regularUserToken || !regularUserId)
					throw new Error("Regular user creation failed");
				createdUserIds.push(regularUserId);

				// Step 3: Create Organization
				const organizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: `Test Org ${faker.string.uuid()}`,
								addressLine1: "123 Main St",
								city: "New York",
								countryCode: "us",
								description: "Test Description",
							},
						},
					},
				);

				const organizationId = organizationResult.data?.createOrganization?.id;
				if (!organizationId) throw new Error("Organization ID not found");
				createdOrganizationIds.push(organizationId);

				const adminUserId = adminSignInResult.data?.signIn?.user?.id;
				if (!adminUserId) throw new Error("Admin User ID not found");

				const membershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								organizationId,
								memberId: adminUserId,
								role: "administrator",
							},
						},
					},
				);
				if (membershipResult.data?.createOrganizationMembership?.id) {
					createdMemberships.push({ organizationId, memberId: adminUserId });
				}

				// Step 4: Create Event
				const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
					headers: {
						authorization: `bearer ${adminToken}`,
					},
					variables: {
						input: {
							organizationId,
							name: "Test Event",
							isPublic: true,
							startAt: EVENT_START_AT,
							endAt: EVENT_END_AT,
						},
					},
				});

				const eventId = eventResult.data?.createEvent?.id;
				if (!eventId) throw new Error("Event ID not found");
				createdEventIds.push(eventId);

				// Step 5: Create Agenda Folder
				const agendaFolderCreationResult = await mercuriusClient.mutate(
					Mutation_createAgendaFolder,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: "Test Agenda Folder",
								organizationId: organizationId,
								eventId: eventId,
								description: "Test Description",
								sequence: 1,
							},
						},
					},
				);

				const agendaFolderId =
					agendaFolderCreationResult.data?.createAgendaFolder?.id;
				if (!agendaFolderId) throw new Error("Agenda folder creation failed");
				createdAgendaFolderIds.push(agendaFolderId);

				// Step 6: Attempt to query agenda folder with regular user (not a member)
				const agendaFolderQueryResult = await mercuriusClient.query(
					Query_agendaFolder,
					{
						headers: {
							authorization: `bearer ${regularUserToken}`,
						},
						variables: {
							input: {
								id: agendaFolderId,
							},
						},
					},
				);

				expect(agendaFolderQueryResult.data.agendaFolder).toBeNull();
				expect(agendaFolderQueryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["agendaFolder"],
						}),
					]),
				);
			});
		},
	);

	test("results in an empty 'errors' field and the expected value for the 'data.agendaFolder' field when accessed by administrator", async () => {
		// Step 1: Admin Sign-in
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const authToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (!authToken) throw new Error("Admin authentication failed");

		// Step 2: Create Organization
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Test St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);

		const organizationId = organizationResult.data?.createOrganization?.id;
		if (!organizationId) throw new Error("Organization data not found");
		createdOrganizationIds.push(organizationId);

		const adminUserId = adminSignInResult.data?.signIn?.user?.id;
		if (!adminUserId) throw new Error("Admin User ID not found");

		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId,
						memberId: adminUserId,
						role: "administrator",
					},
				},
			},
		);
		if (membershipResult.data?.createOrganizationMembership?.id) {
			createdMemberships.push({ organizationId, memberId: adminUserId });
		}

		// Step 3: Create Event
		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
					name: "Test Event",
					isPublic: true,
					startAt: EVENT_START_AT,
					endAt: EVENT_END_AT,
				},
			},
		});

		const eventId = eventResult.data?.createEvent?.id;
		if (!eventId) throw new Error("Event data not found");
		createdEventIds.push(eventId);

		// Step 4: Create Agenda Folder
		const agendaFolderResult = await mercuriusClient.mutate(
			Mutation_createAgendaFolder,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: "Test Agenda Folder",
						organizationId: organizationId,
						eventId: eventId,
						description: "Test Description",
						sequence: 1,
					},
				},
			},
		);

		if (agendaFolderResult.errors) {
			throw new Error(
				`Agenda folder creation failed: ${JSON.stringify(agendaFolderResult.errors)}`,
			);
		}

		const agendaFolder = agendaFolderResult.data?.createAgendaFolder;
		if (!agendaFolder) throw new Error("Agenda folder data not found");
		createdAgendaFolderIds.push(agendaFolder.id);

		// Step 5: Query Agenda Folder
		const queriedAgendaFolderResult = await mercuriusClient.query(
			Query_agendaFolder,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: agendaFolder.id,
					},
				},
			},
		);

		expect(queriedAgendaFolderResult.errors).toBeUndefined();
		assertToBeNonNullish(queriedAgendaFolderResult.data.agendaFolder);
		expect(queriedAgendaFolderResult.data.agendaFolder).toMatchObject({
			id: agendaFolder.id,
			name: "Test Agenda Folder",
			description: "Test Description",
			sequence: 1,
			createdAt: expect.any(String),
		});
	});

	test("results in an empty 'errors' field and the expected value for the 'data.agendaFolder' field when accessed by an organization member", async () => {
		// Step 1: Admin Sign-in
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (!adminToken) throw new Error("Admin authentication failed");

		// Step 2: Create Regular User
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: `${faker.string.uuid()}@test.com`,
						password: "password123",
						name: "Regular User",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			},
		);
		const regularUserId = regularUserResult.data?.createUser?.user?.id;
		const regularUserToken =
			regularUserResult.data?.createUser?.authenticationToken;
		if (!regularUserToken || !regularUserId)
			throw new Error("Regular user creation failed");
		createdUserIds.push(regularUserId);

		// Step 3: Create Organization
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Main St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);
		const organizationId = organizationResult.data?.createOrganization?.id;
		if (!organizationId) throw new Error("Organization creation failed");
		createdOrganizationIds.push(organizationId);

		const adminUserId = adminSignInResult.data?.signIn?.user?.id;
		if (!adminUserId) throw new Error("Admin User ID not found");

		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						memberId: adminUserId,
						role: "administrator",
					},
				},
			},
		);
		if (membershipResult.data?.createOrganizationMembership?.id) {
			createdMemberships.push({ organizationId, memberId: adminUserId });
		}

		// Step 4: Add regular user to organization
		const userMembershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						memberId: regularUserId,
					},
				},
			},
		);
		if (userMembershipResult.data?.createOrganizationMembership?.id) {
			createdMemberships.push({ organizationId, memberId: regularUserId });
		}

		// Step 5: Create Event
		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				input: {
					organizationId,
					name: "Test Event",
					isPublic: true,
					startAt: EVENT_START_AT,
					endAt: EVENT_END_AT,
				},
			},
		});
		const eventId = eventResult.data?.createEvent?.id;
		if (!eventId) throw new Error("Event creation failed");
		createdEventIds.push(eventId);

		// Step 6: Create Agenda Folder
		const agendaFolderCreationResult = await mercuriusClient.mutate(
			Mutation_createAgendaFolder,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Agenda Folder",
						organizationId,
						eventId,
						description: "Test Description",
						sequence: 1,
					},
				},
			},
		);
		const agendaFolderId =
			agendaFolderCreationResult.data?.createAgendaFolder?.id;
		if (!agendaFolderId) throw new Error("Agenda folder creation failed");
		createdAgendaFolderIds.push(agendaFolderId);

		// Step 7: Query Agenda Folder as Regular User (who is org member)
		const agendaFolderQueryResult = await mercuriusClient.query(
			Query_agendaFolder_Restricted,
			{
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: { input: { id: agendaFolderId } },
			},
		);

		expect(agendaFolderQueryResult.errors).toBeUndefined();
		assertToBeNonNullish(agendaFolderQueryResult.data.agendaFolder);
		const queriedAgendaFolder = agendaFolderQueryResult.data.agendaFolder;
		expect(queriedAgendaFolder).toMatchObject({
			id: agendaFolderId,
			name: "Test Agenda Folder",
		});
	});
});
