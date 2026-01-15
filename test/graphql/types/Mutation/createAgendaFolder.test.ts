import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
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
	Query_signIn,
} from "../documentNodes";

let cachedAdminAuth: {
	token: string;
	userId: string;
} | null = null;

async function getAdminAuth() {
	if (cachedAdminAuth) return cachedAdminAuth;

	mercuriusClient.setHeaders({});

	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(result.data?.signIn?.authenticationToken);
	assertToBeNonNullish(result.data?.signIn?.user?.id);

	cachedAdminAuth = {
		token: result.data.signIn.authenticationToken,
		userId: result.data.signIn.user.id,
	};

	return cachedAdminAuth;
}

async function getAdminUserId() {
	const auth = await getAdminAuth();
	return auth.userId;
}

async function addOrganizationMembership(params: {
	adminAuthToken: string;
	memberId: string;
	organizationId: string;
	role: "administrator" | "regular";
}) {
	const result = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${params.adminAuthToken}` },
			variables: {
				input: {
					memberId: params.memberId,
					organizationId: params.organizationId,
					role: params.role,
				},
			},
		},
	);

	expect(result.errors).toBeUndefined();
}

async function createOrganizationAndEvent(
	adminAuthToken: string,
	adminUserId: string,
) {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	assertToBeNonNullish(orgResult.data?.createOrganization);
	const organizationId = orgResult.data.createOrganization.id;

	await addOrganizationMembership({
		adminAuthToken,
		memberId: adminUserId,
		organizationId,
		role: "administrator",
	});

	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId,
				startAt: new Date(Date.now() + 86400000).toISOString(),
				endAt: new Date(Date.now() + 90000000).toISOString(),
				description: "Agenda folder test event",
			},
		},
	});

	assertToBeNonNullish(eventResult.data?.createEvent);
	const eventId = eventResult.data.createEvent.id;

	return {
		organizationId,
		eventId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: eventId } },
			});

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		},
	};
}

suite("Mutation field createAgendaFolder", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();

		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch {
				// Cleanup errors are intentionally swallowed to prevent cascading failures
				// during teardown. The test result is already determined at this point.
			}
		}
		testCleanupFunctions.length = 0;
	});

	suite("Authentication & Authorization", () => {
		test("Returns error when client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				variables: {
					input: {
						eventId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						name: "Folder",
						sequence: 1,
					},
				},
			});

			expect(result.data?.createAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["createAgendaFolder"],
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("Returns error when token user does not exist in DB", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						eventId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						name: "Folder",
						sequence: 1,
					},
				},
			});

			expect(result.data?.createAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		test("Returns error for invalid arguments", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						eventId: "not-a-uuid",
						organizationId: "also-not-a-uuid",
						name: "Folder",
						sequence: 1,
					},
				},
			});

			expect(result.data?.createAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});
	});

	suite("Resource Existence", () => {
		test("Returns error when event does not exist", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						eventId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						name: "Folder",
						sequence: 1,
					},
				},
			});

			expect(result.data?.createAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});
	});

	suite("Authorization Logic", () => {
		test("Returns error when organizationId does not match event organization", async () => {
			const [{ token }, orgAdmin] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(token, await getAdminUserId());
			testCleanupFunctions.push(cleanup);

			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: orgAdmin.userId,
				organizationId,
				role: "administrator",
			});

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: { authorization: `bearer ${orgAdmin.authToken}` },
				variables: {
					input: {
						eventId,
						organizationId: faker.string.uuid(),
						name: "Folder",
						sequence: 1,
					},
				},
			});

			expect(result.data?.createAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("Returns error when regular member tries to create folder", async () => {
			const [{ token }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(token, await getAdminUserId());
			testCleanupFunctions.push(cleanup);

			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: regularUser.userId,
				organizationId,
				role: "regular",
			});

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						eventId,
						organizationId,
						name: "Folder",
						sequence: 1,
					},
				},
			});

			expect(result.data?.createAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		});
	});

	suite("Successful Creation", () => {
		test("Successfully creates agenda folder", async () => {
			const [{ token }, orgAdmin] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(token, await getAdminUserId());
			testCleanupFunctions.push(cleanup);

			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: orgAdmin.userId,
				organizationId,
				role: "administrator",
			});

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: { authorization: `bearer ${orgAdmin.authToken}` },
				variables: {
					input: {
						eventId,
						organizationId,
						name: "Agenda Folder",
						description: "Test folder",
						sequence: 1,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createAgendaFolder);
			expect(result.data.createAgendaFolder).toMatchObject({
				name: "Agenda Folder",
				description: "Test folder",
				sequence: 1,
			});
			expect(result.data.createAgendaFolder.id).toBeDefined();
			expect(result.data.createAgendaFolder.event?.id).toBe(eventId);
		});
	});

	test("Returns unexpected error when insert returns empty array", async () => {
		const { token } = await getAdminAuth();

		const { cleanup, eventId, organizationId } =
			await createOrganizationAndEvent(token, await getAdminUserId());
		testCleanupFunctions.push(cleanup);

		const originalInsert = server.drizzleClient.insert.bind(
			server.drizzleClient,
		);

		vi.spyOn(server.drizzleClient, "insert").mockImplementationOnce(
			(table: unknown) => {
				const tableName =
					typeof table === "object" &&
					table !== null &&
					(table as Record<symbol, unknown>)[Symbol.for("drizzle:Name")];

				if (tableName === "agenda_folders") {
					return {
						values: () => ({
							returning: async () => [],
						}),
					} as unknown as ReturnType<typeof server.drizzleClient.insert>;
				}

				return originalInsert(table as never);
			},
		);

		const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId,
					organizationId,
					name: "Folder",
					sequence: 1,
				},
			},
		});

		expect(result.data?.createAgendaFolder ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
				}),
			]),
		);
	});
});