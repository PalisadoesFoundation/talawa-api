import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { afterEach, expect, suite, test, vi } from "vitest";

import {
	eventsTable,
	organizationMembershipsTable,
	organizationsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_updateAgendaCategory,
	Query_currentUser,
} from "../documentNodes";

let cachedAdminAuth: { token: string; userId: string } | null = null;

async function getAdminAuth() {
	if (cachedAdminAuth) return cachedAdminAuth;

	const { accessToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(accessToken);
	assertToBeNonNullish(userId);

	cachedAdminAuth = {
		token: accessToken,
		userId,
	};

	return cachedAdminAuth;
}

async function getAdminUserId() {
	const auth = await getAdminAuth();
	return auth.userId;
}

async function createOrganizationEventAndCategory(adminUserId: string) {
	const organizationId = uuidv7();
	const eventId = uuidv7();
	const categoryId = uuidv7();

	await server.drizzleClient.insert(organizationsTable).values({
		id: organizationId,
		name: `Org ${faker.string.uuid()}`,
		countryCode: "us",
		creatorId: adminUserId,
	});

	await server.drizzleClient.insert(organizationMembershipsTable).values({
		memberId: adminUserId,
		organizationId,
		role: "administrator",
		creatorId: adminUserId,
	});

	await server.drizzleClient.insert(eventsTable).values({
		id: eventId,
		name: `Event ${faker.string.uuid()}`,
		organizationId,
		creatorId: adminUserId,
		startAt: new Date(),
		endAt: new Date(Date.now() + 3600000),
		description: "Agenda category test event",
	});

	await server.drizzleClient.insert(agendaCategoriesTable).values({
		id: categoryId,
		eventId,
		organizationId,
		name: "Original Category",
		description: "Original description",
		creatorId: adminUserId,
	});

	return {
		organizationId,
		eventId,
		categoryId,
		cleanup: async () => {
			await server.drizzleClient
				.delete(agendaCategoriesTable)
				.where(eq(agendaCategoriesTable.id, categoryId));
			await server.drizzleClient
				.delete(eventsTable)
				.where(eq(eventsTable.id, eventId));
			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(eq(organizationMembershipsTable.organizationId, organizationId));
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, organizationId));
		},
	};
}

suite("Mutation field updateAgendaCategory", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const cleanup of cleanupFns.reverse()) {
			await cleanup();
		}
		cleanupFns.length = 0;
	});

	suite("Authentication and Authorization", () => {
		test("Returns unauthenticated when client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated",
						},
					},
				},
			);

			expect(result.data?.updateAgendaCategory ?? null).toEqual(null);
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

		test("Returns unauthenticated when user is deleted after authentication", async () => {
			const user = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, user.userId));

			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${user.authToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated",
						},
					},
				},
			);

			expect(result.data?.updateAgendaCategory ?? null).toEqual(null);
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

		test("Returns unauthorized when non-member tries to update category", async () => {
			const [_, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const env = await createOrganizationEventAndCategory(
				await getAdminUserId(),
			);
			cleanupFns.push(env.cleanup);

			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${regularUser.authToken}` },
					variables: {
						input: {
							id: env.categoryId,
							name: "Updated",
						},
					},
				},
			);

			expect(result.data?.updateAgendaCategory ?? null).toEqual(null);
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

	suite("Input Validation", () => {
		test("Returns invalid_arguments when no optional field is provided", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndCategory(
				await getAdminUserId(),
			);
			cleanupFns.push(env.cleanup);

			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: env.categoryId,
							// No name or description provided
						},
					},
				},
			);

			expect(result.data?.updateAgendaCategory ?? null).toEqual(null);
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

		test("Returns invalid_arguments for invalid UUID", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: "invalid-uuid",
							name: "Updated",
						},
					},
				},
			);

			expect(result.data?.updateAgendaCategory ?? null).toEqual(null);
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
		test("Returns not found when agenda category does not exist", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated",
						},
					},
				},
			);

			expect(result.data?.updateAgendaCategory ?? null).toEqual(null);
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

	suite("Successful Updates", () => {
		test("Updates name successfully", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndCategory(
				await getAdminUserId(),
			);
			cleanupFns.push(env.cleanup);

			const newName = `Updated ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: env.categoryId,
							name: newName,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaCategory?.name).toBe(newName);
		});

		test("Updates description successfully", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndCategory(
				await getAdminUserId(),
			);
			cleanupFns.push(env.cleanup);

			const newDescription = "Updated description";
			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: env.categoryId,
							description: newDescription,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaCategory?.description).toBe(
				newDescription,
			);
		});

		test("Updates name and description together", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndCategory(
				await getAdminUserId(),
			);
			cleanupFns.push(env.cleanup);

			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: env.categoryId,
							name: "New Name",
							description: "New Description",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaCategory).toEqual(
				expect.objectContaining({
					id: env.categoryId,
					name: "New Name",
					description: "New Description",
				}),
			);
		});
	});

	suite("Edge Cases", () => {
		test("Returns unexpected when update returns empty array", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndCategory(
				await getAdminUserId(),
			);
			cleanupFns.push(env.cleanup);

			vi.spyOn(server.drizzleClient, "update").mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: async () => [],
					}),
				}),
			} as unknown as ReturnType<typeof server.drizzleClient.update>);

			const result = await mercuriusClient.mutate(
				Mutation_updateAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: env.categoryId,
							name: "Updated",
						},
					},
				},
			);

			expect(result.data?.updateAgendaCategory ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						path: ["updateAgendaCategory"],
					}),
				]),
			);
		});
	});
});
