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
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_updateAgendaFolder,
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

async function createOrganizationEventAndFolder(params: {
	adminUserId: string;
	isDefaultFolder?: boolean;
}) {
	const organizationId = uuidv7();
	const eventId = uuidv7();
	const folderId = uuidv7();

	await server.drizzleClient.insert(organizationsTable).values({
		id: organizationId,
		name: `Org ${faker.string.uuid()}`,
		countryCode: "us",
		creatorId: params.adminUserId,
	});

	await server.drizzleClient.insert(organizationMembershipsTable).values({
		memberId: params.adminUserId,
		organizationId,
		role: "administrator",
		creatorId: params.adminUserId,
	});

	await server.drizzleClient.insert(eventsTable).values({
		id: eventId,
		name: `Event ${faker.string.uuid()}`,
		organizationId,
		creatorId: params.adminUserId,
		startAt: new Date(),
		endAt: new Date(Date.now() + 3600000),
		description: "Agenda folder test event",
	});

	await server.drizzleClient.insert(agendaFoldersTable).values({
		id: folderId,
		eventId,
		organizationId,
		name: "Original Folder",
		description: "Original description",
		sequence: 1,
		isDefaultFolder: params.isDefaultFolder ?? false,
		creatorId: params.adminUserId,
	});

	return {
		folderId,
		organizationId,
		eventId,
		cleanup: async () => {
			await server.drizzleClient
				.delete(agendaFoldersTable)
				.where(eq(agendaFoldersTable.id, folderId));
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

suite("Mutation field updateAgendaFolder", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (e) {
				console.error(e);
			}
		}
		cleanupFns.length = 0;
	});

	test("Returns unauthenticated when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Updated",
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("Returns unauthenticated when token user no longer exists", async () => {
		const user = await createRegularUserUsingAdmin();

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, user.userId));

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Updated",
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("Returns not found when agenda folder does not exist", async () => {
		const { token } = await getAdminAuth();

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Updated",
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
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

	test("Returns unauthorized for regular org member", async () => {
		const [{ userId: adminUserId }, regularUser] = await Promise.all([
			getAdminAuth(),
			createRegularUserUsingAdmin(),
		]);

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: regularUser.userId,
			organizationId: env.organizationId,
			role: "regular",
			creatorId: adminUserId,
		});

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					id: env.folderId,
					name: "Updated",
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
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

	test("Blocks updating name/description of default folder", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({
			adminUserId,
			isDefaultFolder: true,
		});
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					name: "New Name",
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
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

	test("Blocks updating description of default folder", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({
			adminUserId,
			isDefaultFolder: true,
		});
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					description: "New Description",
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
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

	test("Returns invalid_arguments when id is not a valid UUID", async () => {
		const { token } = await getAdminAuth();

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: "invalid-uuid",
					name: "Updated",
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when no updatable field is provided", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
				},
			},
		});

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input"],
								message: expect.stringContaining("optional argument"),
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("Updates name, description and sequence successfully", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					name: "Updated Folder",
					description: "Updated description",
					sequence: 5,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaFolder).toEqual(
			expect.objectContaining({
				id: env.folderId,
				name: "Updated Folder",
				description: "Updated description",
				sequence: 5,
			}),
		);
	});

	test("Allows updating only sequence for default folder", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({
			adminUserId,
			isDefaultFolder: true,
		});
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					sequence: 10,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaFolder).toEqual(
			expect.objectContaining({
				id: env.folderId,
				sequence: 10,
			}),
		);
	});

	test("Allows organization administrator to update agenda folder", async () => {
		const [{ userId: adminUserId }, regularUser] = await Promise.all([
			getAdminAuth(),
			createRegularUserUsingAdmin(),
		]);

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		// Make regular user org admin
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: regularUser.userId,
			organizationId: env.organizationId,
			role: "administrator",
			creatorId: adminUserId,
		});

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					id: env.folderId,
					name: "Org Admin Update",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaFolder?.name).toBe("Org Admin Update");
	});

	test("Updates only description successfully", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					description: "Description Only Update",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaFolder).toEqual(
			expect.objectContaining({
				id: env.folderId,
				description: "Description Only Update",
			}),
		);
	});

	test("Updates only name successfully", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					name: "Name Only Update",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaFolder).toEqual(
			expect.objectContaining({
				id: env.folderId,
				name: "Name Only Update",
			}),
		);
	});

	test("Updates only sequence for non-default folder", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					sequence: 99,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaFolder).toEqual(
			expect.objectContaining({
				id: env.folderId,
				sequence: 99,
			}),
		);
	});

	test("Allows global admin to update folder without organization membership", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		// Delete admin membership explicitly
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				eq(organizationMembershipsTable.organizationId, env.organizationId),
			);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					name: "Global Admin Update",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaFolder?.name).toBe("Global Admin Update");
	});

	test("Returns unexpected when update returns empty array", async () => {
		const { userId: adminUserId, token } = await getAdminAuth();

		const env = await createOrganizationEventAndFolder({ adminUserId });
		cleanupFns.push(env.cleanup);

		const updateSpy = vi
			.spyOn(server.drizzleClient, "update")
			.mockReturnValueOnce({
				set: () => ({
					where: () => ({
						returning: async () => [],
					}),
				}),
			} as unknown as ReturnType<typeof server.drizzleClient.update>);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: env.folderId,
					name: "Updated",
				},
			},
		});

		expect(updateSpy).toHaveBeenCalledWith(agendaFoldersTable);

		expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unexpected" }),
				}),
			]),
		);
	});
});
