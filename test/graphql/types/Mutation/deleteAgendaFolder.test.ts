import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";

import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaFolder,
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_deleteAgendaFolder = gql(`
  mutation Mutation_deleteAgendaFolder($input: MutationDeleteAgendaFolderInput!) {
    deleteAgendaFolder(input: $input) {
      id
      name
      description
    }
  }
`);

let cachedAdminAuth: { token: string; userId: string } | null = null;

async function getAdminAuth() {
	if (cachedAdminAuth) return cachedAdminAuth;

	// Ensure clean client state before authentication
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
	return (await getAdminAuth()).userId;
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

async function createOrganizationEventAndFolder(adminAuthToken: string) {
	const adminUserId = await getAdminUserId();

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
				startAt: new Date().toISOString(),
				endAt: new Date(Date.now() + 3600000).toISOString(),
				description: "Agenda folder delete test",
			},
		},
	});
	assertToBeNonNullish(eventResult.data?.createEvent);
	const eventId = eventResult.data.createEvent.id;

	const folderResult = await mercuriusClient.mutate(
		Mutation_createAgendaFolder,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					eventId,
					organizationId,
					name: "Test Folder",
					description: "Folder description",
					sequence: 1,
				},
			},
		},
	);
	assertToBeNonNullish(folderResult.data?.createAgendaFolder);
	const folderId = folderResult.data.createAgendaFolder.id;

	return {
		folderId,
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

suite("Mutation field deleteAgendaFolder", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch {
				// Cleanup errors are intentionally swallowed to prevent cascading failures.
				// The test result is already determined at this point.
			}
		}
		cleanupFns.length = 0;
		mercuriusClient.setHeaders({});
	});

	suite("Authentication", () => {
		test("Returns unauthenticated when client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				variables: { input: { id: faker.string.uuid() } },
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						path: ["deleteAgendaFolder"],
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("Returns unauthenticated when token user does not exist", async () => {
			const user = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, user.userId));

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${user.authToken}` },
				variables: { input: { id: faker.string.uuid() } },
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		test("Returns invalid_arguments for invalid UUID", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: "not-a-uuid" } },
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
					}),
				]),
			);
		});
	});

	suite("Resource Existence", () => {
		test("Returns not found when agenda folder does not exist", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: faker.string.uuid() } },
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						path: ["deleteAgendaFolder"],
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
					}),
				]),
			);
		});
	});

	suite("Authorization", () => {
		test("Returns unauthorized for regular org member", async () => {
			const [{ token }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const env = await createOrganizationEventAndFolder(token);
			cleanupFns.push(env.cleanup);

			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: regularUser.userId,
				organizationId: env.organizationId,
				role: "regular",
			});

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: { input: { id: env.folderId } },
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						path: ["deleteAgendaFolder"],
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("Returns forbidden when trying to delete default agenda folder", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndFolder(token);
			cleanupFns.push(env.cleanup);

			// Fetch default folder id for this event
			const defaultFolder =
				await server.drizzleClient.query.agendaFoldersTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.eventId, env.eventId),
							operators.eq(fields.isDefaultFolder, true),
						),
				});

			assertToBeNonNullish(defaultFolder);

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: defaultFolder.id } },
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		});
	});

	suite("Successful Deletion", () => {
		test("Deletes agenda folder successfully as admin", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndFolder(token);
			cleanupFns.push(env.cleanup);

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: env.folderId } },
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteAgendaFolder);
			expect(result.data.deleteAgendaFolder.id).toEqual(env.folderId);
		});

		test("Returns unexpected when delete returns empty array", async () => {
			const { token } = await getAdminAuth();
			const env = await createOrganizationEventAndFolder(token);
			cleanupFns.push(env.cleanup);

			// Mock required: This edge case (delete returning empty array) cannot be
			// reproduced with real DB constraints. The mock ensures branch coverage
			// for the defensive check after agenda folder deletion.
			const spy = vi
				.spyOn(server.drizzleClient, "transaction")
				.mockImplementationOnce(async (cb) => {
					const tx = {
						query: server.drizzleClient.query,
						update: () => ({
							set: () => ({
								where: async () => undefined,
							}),
						}),
						delete: () => ({
							where: () => ({
								returning: async () => [],
							}),
						}),
					};

					return cb(
						tx as unknown as Parameters<
							typeof server.drizzleClient.transaction
						>[0] extends (arg: infer T) => unknown
							? T
							: never,
					);
				});

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: env.folderId } },
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
					}),
				]),
			);

			spy.mockRestore();
		});

		test("Reassigns agenda items to default folder on folder deletion", async () => {
			const { token } = await getAdminAuth();

			// Setup org, event, non-default folder
			const env = await createOrganizationEventAndFolder(token);
			cleanupFns.push(env.cleanup);

			// Fetch default folder for this event
			const defaultFolder =
				await server.drizzleClient.query.agendaFoldersTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.eventId, env.eventId),
							operators.eq(fields.isDefaultFolder, true),
						),
				});

			assertToBeNonNullish(defaultFolder);

			// Create agenda item inside the folder that will be deleted
			const createItemResult = await mercuriusClient.mutate(
				Mutation_createAgendaItem,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							eventId: env.eventId,
							folderId: env.folderId,
							name: "Item to be reassigned",
							sequence: 1,
							type: "general",
						},
					},
				},
			);

			assertToBeNonNullish(createItemResult.data?.createAgendaItem);
			const agendaItemId = createItemResult.data.createAgendaItem.id;

			// Delete the folder
			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaFolder,
				{
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: env.folderId } },
				},
			);

			expect(deleteResult.errors).toBeUndefined();

			// Fetch agenda item again from DB
			const updatedItem =
				await server.drizzleClient.query.agendaItemsTable.findFirst({
					columns: { folderId: true },
					where: (fields, operators) => operators.eq(fields.id, agendaItemId),
				});

			assertToBeNonNullish(updatedItem);

			// Agenda item moved to default folder
			expect(updatedItem.folderId).toBe(defaultFolder.id);
		});
	});
});
