import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";

import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaFolder,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_agendaFoldersByEventId,
	Query_signIn,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const adminAuthToken = signInResult.data.signIn.authenticationToken;
const adminUserId = signInResult.data.signIn.user?.id;

assertToBeNonNullish(adminAuthToken);
assertToBeNonNullish(adminUserId);

suite("Query field agendaFoldersByEventId", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of cleanupFns.reverse()) {
			await cleanup();
		}
		cleanupFns.length = 0;
	});

	test("Returns unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.query(Query_agendaFoldersByEventId, {
			variables: {
				eventId: faker.string.uuid(),
			},
		});

		expect(result.data?.agendaFoldersByEventId ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["agendaFoldersByEventId"],
				}),
			]),
		);
	});

	test("Returns unexpected error when user is deleted after authentication", async () => {
		const regularUser = await createRegularUserUsingAdmin();
		let eventId: string | undefined;

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { name: "Org", countryCode: "us" },
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;

		cleanupFns.push(async () => {
			if (eventId) {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			}

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Event",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 10000).toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		eventId = createEventResult.data.createEvent.id;

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, regularUser.userId));

		const result = await mercuriusClient.query(Query_agendaFoldersByEventId, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { eventId },
		});

		expect(result.data?.agendaFoldersByEventId ?? null).toEqual(null);
		expect(
			result.errors?.some((e) => e.extensions?.code === "unauthenticated"),
		).toBe(true);
	});

	test("Returns an error when an authenticated non-administrator user queries agenda folders by eventId", async () => {
		// Create a regular user
		const regularUser = await createRegularUserUsingAdmin();
		const { authToken } = regularUser;

		cleanupFns.push(async () => {
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));
		});

		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;

		// Make admin user org administrator (required to create event)
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: `Event ${faker.string.uuid()}`,
						organizationId,
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
						description: "Auth test event",
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		const eventId = createEventResult.data.createEvent.id;

		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: eventId } },
			});
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		// Regular user is NOT a member of the organization

		// Attempt to query agenda folders
		const result = await mercuriusClient.query(Query_agendaFoldersByEventId, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				eventId,
			},
		});

		// Assert authorization failure
		expect(result.data?.agendaFoldersByEventId).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["eventId"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["agendaFoldersByEventId"],
				}),
			]),
		);
	});

	test("Returns invalid_arguments for invalid eventId UUID", async () => {
		const result = await mercuriusClient.query(Query_agendaFoldersByEventId, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				eventId: "invalid-uuid",
			},
		});

		expect(result.data?.agendaFoldersByEventId ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["eventId"],
							}),
						]),
					}),
					path: ["agendaFoldersByEventId"],
				}),
			]),
		);
	});

	test("Returns not_found when event does not exist", async () => {
		const result = await mercuriusClient.query(Query_agendaFoldersByEventId, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				eventId: faker.string.uuid(),
			},
		});

		expect(result.data?.agendaFoldersByEventId ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["eventId"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("Returns default agenda folder when no custom folders exist", async () => {
		let eventId: string | undefined;

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;

		cleanupFns.push(async () => {
			if (eventId) {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			}

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Event without folders",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 3600000).toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		eventId = createEventResult.data.createEvent.id;

		const result = await mercuriusClient.query(Query_agendaFoldersByEventId, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { eventId },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.agendaFoldersByEventId).toHaveLength(1);
		expect(result.data?.agendaFoldersByEventId?.[0]).toMatchObject({
			name: "Default",
			description: "Default agenda folder",
			sequence: 1,
		});
	});

	test("Returns agenda folders for event", async () => {
		let eventId: string | undefined;

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;

		cleanupFns.push(async () => {
			if (eventId) {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			}

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Event with folders",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 3600000).toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		eventId = createEventResult.data.createEvent.id;

		await mercuriusClient.mutate(Mutation_createAgendaFolder, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					eventId,
					organizationId,
					name: "Folder 1",
					description: "Desc 1",
					sequence: 1,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createAgendaFolder, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					eventId,
					organizationId,
					name: "Folder 2",
					description: "Desc 2",
					sequence: 2,
				},
			},
		});

		const result = await mercuriusClient.query(Query_agendaFoldersByEventId, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { eventId },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.agendaFoldersByEventId).toHaveLength(3);
		// Verify folders are returned in sequence order
		const folders = result.data?.agendaFoldersByEventId ?? [];
		expect(folders.map((folder) => folder.name)).toEqual([
			"Default",
			"Folder 1",
			"Folder 2",
		]);
	});
});
