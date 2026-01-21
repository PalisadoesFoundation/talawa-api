import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
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
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteAgendaItem,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";

let cachedAdminAuth: { token: string; userId: string } | null = null;

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

	expect(result.errors).toBeUndefined();
	assertToBeNonNullish(result.data?.signIn?.authenticationToken);
	assertToBeNonNullish(result.data?.signIn?.user?.id);

	cachedAdminAuth = {
		token: result.data.signIn.authenticationToken,
		userId: result.data.signIn.user.id,
	};

	return cachedAdminAuth;
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
	assertToBeNonNullish(result.data?.createOrganizationMembership);
}

async function createAgendaItemEnv(adminToken: string) {
	const adminUserId = (await getAdminAuth()).userId;

	const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
		},
	});
	expect(orgRes.errors).toBeUndefined();
	assertToBeNonNullish(orgRes.data?.createOrganization);
	const organizationId = orgRes.data.createOrganization.id;

	await addOrganizationMembership({
		adminAuthToken: adminToken,
		memberId: adminUserId,
		organizationId,
		role: "administrator",
	});

	const eventRes = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId,
				startAt: new Date(Date.now() + 5_000).toISOString(),
				endAt: new Date(Date.now() + 3_600_000 + 5_000).toISOString(),
			},
		},
	});
	expect(eventRes.errors).toBeUndefined();
	assertToBeNonNullish(eventRes.data?.createEvent);
	const eventId = eventRes.data.createEvent.id;

	const itemRes = await mercuriusClient.mutate(Mutation_createAgendaItem, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				eventId,
				name: "Agenda Item",
				sequence: 1,
				type: "general",
			},
		},
	});
	expect(itemRes.errors).toBeUndefined();
	assertToBeNonNullish(itemRes.data?.createAgendaItem);
	const itemId = itemRes.data.createAgendaItem.id;

	return {
		itemId,
		organizationId,
		eventId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: eventId } },
			});
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: organizationId } },
			});
		},
	};
}

suite("Mutation field deleteAgendaItem", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch {
				// Cleanup errors are intentionally swallowed to prevent cascading failures
				// during teardown. The test result is already determined at this point.
			}
		}
		cleanupFns.length = 0;
		mercuriusClient.setHeaders({});
	});

	test("Returns unauthenticated when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
			variables: { input: { id: faker.string.uuid() } },
		});

		expect(result.data?.deleteAgendaItem ?? null).toEqual(null);
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

	test("Returns unauthenticated when token user does not exist", async () => {
		const user = await createRegularUserUsingAdmin();

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, user.userId));

		const result = await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: { input: { id: faker.string.uuid() } },
		});

		expect(result.data?.deleteAgendaItem ?? null).toEqual(null);
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

	test("Returns invalid_arguments for invalid UUID", async () => {
		const { token } = await getAdminAuth();

		const result = await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: { input: { id: "not-a-uuid" } },
		});

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

	test("Returns not found when agenda item does not exist", async () => {
		const { token } = await getAdminAuth();

		const result = await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: { input: { id: faker.string.uuid() } },
		});

		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining({
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

	test("Returns unauthorized for regular org member", async () => {
		const [{ token }, regular] = await Promise.all([
			getAdminAuth(),
			createRegularUserUsingAdmin(),
		]);

		const env = await createAgendaItemEnv(token);
		cleanupFns.push(env.cleanup);

		await addOrganizationMembership({
			adminAuthToken: token,
			memberId: regular.userId,
			organizationId: env.organizationId,
			role: "regular",
		});

		const result = await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
			headers: { authorization: `bearer ${regular.authToken}` },
			variables: { input: { id: env.itemId } },
		});

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

	test("Deletes agenda item successfully as admin", async () => {
		const { token } = await getAdminAuth();
		const env = await createAgendaItemEnv(token);
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: { input: { id: env.itemId } },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.deleteAgendaItem);
		expect(result.data.deleteAgendaItem.id).toBe(env.itemId);
	});

	test("Returns unexpected when delete returns empty array", async () => {
		const { token } = await getAdminAuth();
		const env = await createAgendaItemEnv(token);
		cleanupFns.push(env.cleanup);

		const originalDelete = server.drizzleClient.delete.bind(
			server.drizzleClient,
		);

		vi.spyOn(server.drizzleClient, "delete").mockImplementation((table) => {
			if (table === agendaItemsTable) {
				// 👇 Intentional partial mock – escape typing safely
				return {
					where: () => ({
						returning: async () => [],
					}),
				} as unknown as ReturnType<typeof server.drizzleClient.delete>;
			}

			return originalDelete(table);
		});

		const result = await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: { input: { id: env.itemId } },
		});

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
