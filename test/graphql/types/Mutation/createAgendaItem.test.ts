import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { agendaFoldersTable, usersTable } from "~/src/drizzle/schema";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaCategory,
	Mutation_createAgendaFolder,
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";

let cachedAdminAuth: { token: string; userId: string } | null = null;

async function getAdminAuth() {
	if (cachedAdminAuth) return cachedAdminAuth;

	mercuriusClient.setHeaders({});

	const {
		API_ADMINISTRATOR_USER_EMAIL_ADDRESS: email,
		API_ADMINISTRATOR_USER_PASSWORD: password,
	} = server.envConfig;

	if (!email || !password) {
		throw new Error("Missing admin credentials for tests.");
	}

	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: { emailAddress: email, password },
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

async function createOrgEventFolderCategory(adminToken: string) {
	const adminUserId = await getAdminUserId();

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
				startAt: new Date(Date.now() + 86400000).toISOString(),
				endAt: new Date(Date.now() + 90000000).toISOString(),
			},
		},
	});

	expect(eventRes.errors).toBeUndefined();
	assertToBeNonNullish(eventRes.data?.createEvent);
	const eventId = eventRes.data.createEvent.id;

	const folderRes = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				eventId,
				organizationId,
				name: "Folder",
				sequence: 1,
			},
		},
	});

	expect(folderRes.errors).toBeUndefined();
	assertToBeNonNullish(folderRes.data?.createAgendaFolder);
	const folderId = folderRes.data.createAgendaFolder.id;

	const categoryRes = await mercuriusClient.mutate(
		Mutation_createAgendaCategory,
		{
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					eventId,
					name: "Category",
				},
			},
		},
	);

	expect(categoryRes.errors).toBeUndefined();
	assertToBeNonNullish(categoryRes.data?.createAgendaCategory);
	const categoryId = categoryRes.data.createAgendaCategory.id;

	return {
		organizationId,
		eventId,
		folderId,
		categoryId,
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

suite("Mutation field createAgendaItem", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch {}
		}
		cleanupFns.length = 0;
	});

	/* ---------------- Authentication ---------------- */

	test("Returns error when unauthenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			variables: {
				input: {
					eventId: faker.string.uuid(),
					folderId: faker.string.uuid(),
					categoryId: faker.string.uuid(),
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});

		expect(result.data?.createAgendaItem ?? null).toBe(null);
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

	test("Returns unauthenticated when token user does not exist", async () => {
		const regular = await createRegularUserUsingAdmin();

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, regular.userId));

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${regular.authToken}` },
			variables: {
				input: {
					eventId: faker.string.uuid(),
					folderId: faker.string.uuid(),
					categoryId: faker.string.uuid(),
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});

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

	test("Returns invalid_arguments for invalid input", async () => {
		const { token } = await getAdminAuth();

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: "not-a-uuid",
					folderId: faker.string.uuid(),
					categoryId: faker.string.uuid(),
					name: "",
					sequence: 0,
					type: "note",
				},
			},
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

	test("Returns error when folder does not exist", async () => {
		const { token } = await getAdminAuth();

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: faker.string.uuid(),
					folderId: faker.string.uuid(),
					categoryId: faker.string.uuid(),
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});
		assertToBeNonNullish(result.errors);
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

	test("Returns forbidden when folder does not belong to event", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		const otherEvent = await createOrgEventFolderCategory(token);
		cleanupFns.push(otherEvent.cleanup);

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: otherEvent.eventId,
					folderId: data.folderId,
					categoryId: data.categoryId,
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});

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

	test("Returns unauthorized when regular member tries to create item", async () => {
		const [{ token }, regular] = await Promise.all([
			getAdminAuth(),
			createRegularUserUsingAdmin(),
		]);

		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		await addOrganizationMembership({
			adminAuthToken: token,
			memberId: regular.userId,
			organizationId: data.organizationId,
			role: "regular",
		});

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${regular.authToken}` },
			variables: {
				input: {
					eventId: data.eventId,
					folderId: data.folderId,
					categoryId: data.categoryId,
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
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

	test("Successfully creates agenda item with attachments and urls", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: data.eventId,
					folderId: data.folderId,
					categoryId: data.categoryId,
					name: "Agenda Item",
					sequence: 1,
					type: "song",
					key: "C",
					url: [{ url: "https://example.com" }],
					attachments: [
						{
							name: "file.pdf",
							mimeType: "IMAGE_PNG",
							objectName: "obj",
							fileHash: "hash",
						},
					],
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createAgendaItem);

		expect(result.data.createAgendaItem).toMatchObject({
			name: "Agenda Item",
			type: "song",
		});
		expect(result.data.createAgendaItem.url).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ url: "https://example.com" }),
			]),
		);
		expect(result.data.createAgendaItem.attachments).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "file.pdf",
					mimeType: "image/png",
					objectName: "obj",
					fileHash: "hash",
				}),
			]),
		);
	});

	test("Uses default agenda folder when folderId is not provided", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: data.eventId,
					// folderId omitted
					categoryId: data.categoryId,
					name: "Item using default folder",
					sequence: 1,
					type: "general",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createAgendaItem);
	});

	test("Uses default agenda category when categoryId is not provided", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: data.eventId,
					folderId: data.folderId,
					//  categoryId omitted
					name: "Item using default category",
					sequence: 1,
					type: "general",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createAgendaItem);
	});

	test("Returns error when default agenda folder does not exist", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		// Delete ALL agenda folders for the event (including default)
		await server.drizzleClient
			.delete(agendaFoldersTable)
			.where(eq(agendaFoldersTable.eventId, data.eventId));

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: data.eventId,
					// folderId omitted → forces default lookup
					categoryId: data.categoryId,
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});

		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "eventId"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("Returns error when provided categoryId does not exist", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: data.eventId,
					folderId: data.folderId,
					categoryId: faker.string.uuid(), // invalid category
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});

		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "categoryId"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("Returns error when default category does not exist", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		await server.drizzleClient
			.delete(agendaCategoriesTable)
			.where(eq(agendaCategoriesTable.eventId, data.eventId));

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: data.eventId,
					folderId: data.folderId,
					// categoryId omitted
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});

		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "eventId"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("Returns error when agenda item creation returns empty result", async () => {
		const { token } = await getAdminAuth();
		const data = await createOrgEventFolderCategory(token);
		cleanupFns.push(data.cleanup);

		const spy = vi
			.spyOn(server.drizzleClient, "transaction")
			.mockImplementationOnce(async (cb) => {
				const tx = {
					insert: () => ({
						values: () => ({
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

		const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId: data.eventId,
					folderId: data.folderId,
					categoryId: data.categoryId,
					name: "Item",
					sequence: 1,
					type: "general",
				},
			},
		});

		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "folderId"],
							}),
						]),
					}),
				}),
			]),
		);

		spy.mockRestore();
	});
});
