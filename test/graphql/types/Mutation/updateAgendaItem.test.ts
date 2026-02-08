import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import {
	agendaCategoriesTable,
	agendaFoldersTable,
	eventsTable,
	organizationMembershipsTable,
	organizationsTable,
} from "~/src/drizzle/schema";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createAgendaCategory,
	Mutation_createAgendaFolder,
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_updateAgendaItem,
	Query_signIn,
} from "../documentNodes";

let cachedAdminAuth: { token: string; userId: string } | null = null;

async function getAdminAuth() {
	if (cachedAdminAuth) return cachedAdminAuth;

	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(signInResult.data?.signIn?.authenticationToken);
	assertToBeNonNullish(signInResult.data?.signIn?.user?.id);

	cachedAdminAuth = {
		token: signInResult.data.signIn.authenticationToken,
		userId: signInResult.data.signIn.user.id,
	};

	return cachedAdminAuth;
}

async function getAdminUserId() {
	const auth = await getAdminAuth();
	return auth.userId;
}

async function insertAgendaItemUrls(agendaItemId: string, urls: string[]) {
	const adminUserId = await getAdminUserId();

	await server.drizzleClient.insert(agendaItemUrlTable).values(
		urls.map((url) => ({
			agendaItemId,
			url,
			creatorId: adminUserId,
			updaterId: adminUserId,
		})),
	);
}

async function createOrganizationAndEvent() {
	const { token, userId } = await getAdminAuth();

	const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	const orgId = orgRes.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);

	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				organizationId: orgId,
				memberId: userId,
				role: "administrator",
			},
		},
	});

	const eventRes = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				organizationId: orgId,
				name: "Test Event",
				description: "Agenda Event",
				startAt: new Date(Date.now() + 5_000).toISOString(),
				endAt: new Date(Date.now() + 3_600_000 + 5_000).toISOString(),
				location: "Test Location",
			},
		},
	});

	const eventId = eventRes.data?.createEvent?.id;
	assertToBeNonNullish(eventId);

	return { orgId, eventId };
}

async function createCategoryFolderAgendaItem() {
	const { token } = await getAdminAuth();
	const { orgId, eventId } = await createOrganizationAndEvent();

	const categoryRes = await mercuriusClient.mutate(
		Mutation_createAgendaCategory,
		{
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId,
					name: "Category",
					description: "Agenda Category",
				},
			},
		},
	);

	const categoryId = categoryRes.data?.createAgendaCategory?.id;
	assertToBeNonNullish(categoryId);

	const folderRes = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				eventId,
				organizationId: orgId,
				name: "Folder",
				sequence: 2,
			},
		},
	});

	const folderId = folderRes.data?.createAgendaFolder?.id;
	assertToBeNonNullish(folderId);

	const agendaItemRes = await mercuriusClient.mutate(
		Mutation_createAgendaItem,
		{
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					name: "Agenda Item",
					type: "general",
					eventId,
					folderId,
					categoryId,
					sequence: 2,
				},
			},
		},
	);

	const agendaItemId = agendaItemRes.data?.createAgendaItem?.id;
	assertToBeNonNullish(agendaItemId);

	return {
		orgId,
		eventId,
		folderId,
		categoryId,
		agendaItemId,
		cleanup: async () => {
			await server.drizzleClient
				.delete(agendaItemUrlTable)
				.where(eq(agendaItemUrlTable.agendaItemId, agendaItemId));

			await server.drizzleClient
				.delete(agendaItemsTable)
				.where(eq(agendaItemsTable.id, agendaItemId));

			await server.drizzleClient
				.delete(agendaFoldersTable)
				.where(eq(agendaFoldersTable.id, folderId));

			await server.drizzleClient
				.delete(agendaCategoriesTable)
				.where(eq(agendaCategoriesTable.id, categoryId));

			await server.drizzleClient
				.delete(eventsTable)
				.where(eq(eventsTable.id, eventId));

			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(eq(organizationMembershipsTable.organizationId, orgId));

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, orgId));
		},
	};
}

suite("Mutation field updateAgendaItem", () => {
	const cleanupFns: Array<() => Promise<void>> = [];
	afterEach(async () => {
		vi.restoreAllMocks();

		for (const cleanup of cleanupFns.reverse()) {
			await cleanup();
		}

		cleanupFns.length = 0;
	});

	test("should update agenda item successfully", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					name: "Updated Name",
					description: "Updated description",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaItem).toEqual(
			expect.objectContaining({
				id: agendaItemId,
				name: "Updated Name",
			}),
		);
	});

	test("should throw unauthenticated error when not authenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Fail",
				},
			},
		});

		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw invalid_arguments error for invalid input", async () => {
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: "invalid-id",
					name: "Fail",
				},
			},
		});

		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should throw not found error when agenda item does not exist", async () => {
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Fail",
				},
			},
		});

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("should throw forbidden error when updating note type with duration", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;

		// Force type to "note" directly
		await server.drizzleClient
			.update(agendaItemsTable)
			.set({ type: "note" })
			.where(eq(agendaItemsTable.id, agendaItemId));
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					duration: "10m",
				},
			},
		});

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
	});

	test("should throw unauthorized error for non-admin user", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;
		const { token } = await getAdminAuth();
		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					emailAddress: `user${faker.string.ulid()}@x.com`,
					password: "password",
					name: "User",
					role: "regular",
					isEmailAddressVerified: true,
				},
			},
		});

		const userToken = userRes.data?.createUser?.authenticationToken;
		assertToBeNonNullish(userToken);

		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					id: agendaItemId,
					name: "Fail",
				},
			},
		});

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("should replace attachments when provided", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					attachments: [
						{
							name: "file.jpeg",
							fileHash:
								"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
							mimeType: "IMAGE_JPEG",
							objectName: "file.jpeg",
						},
					],
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaItem?.attachments).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "file.jpeg",
					mimeType: "image/jpeg",
				}),
			]),
		);
	});

	test("should update categoryId from one category to another", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const { eventId, categoryId, agendaItemId } = env;
		const { token } = await getAdminAuth();
		// Create a second category in the same event
		const secondCategoryRes = await mercuriusClient.mutate(
			Mutation_createAgendaCategory,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						eventId,
						name: "Second Category",
						description: "Another category",
					},
				},
			},
		);

		const newCategoryId = secondCategoryRes.data?.createAgendaCategory?.id;
		assertToBeNonNullish(newCategoryId);

		// Sanity check: agenda item initially has first category
		const beforeUpdate =
			await server.drizzleClient.query.agendaItemsTable.findFirst({
				columns: { categoryId: true },
				where: (fields, operators) => operators.eq(fields.id, agendaItemId),
			});

		assertToBeNonNullish(beforeUpdate);
		expect(beforeUpdate.categoryId).toBe(categoryId);
		// Update agenda item → change category
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					categoryId: newCategoryId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaItem).toEqual(
			expect.objectContaining({
				id: agendaItemId,
				category: expect.objectContaining({
					id: newCategoryId,
				}),
			}),
		);

		// Verify DB state reflects updated category
		const afterUpdate =
			await server.drizzleClient.query.agendaItemsTable.findFirst({
				columns: { categoryId: true },
				where: (fields, operators) => operators.eq(fields.id, agendaItemId),
			});

		assertToBeNonNullish(afterUpdate);
		expect(afterUpdate.categoryId).toBe(newCategoryId);
	});

	test("should throw not found error when categoryId does not exist", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;

		const nonExistentCategoryId = faker.string.uuid();
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					categoryId: nonExistentCategoryId,
				},
			},
		});

		expect(result.data?.updateAgendaItem ?? null).toEqual(null);
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

	test("should throw forbidden error when category belongs to a different event", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const { agendaItemId, eventId: itemEventId } = env;
		// Create another organization + event
		const otherOrgEvent = await createOrganizationAndEvent();
		const { token } = await getAdminAuth();
		// Create category in DIFFERENT event
		const foreignCategoryRes = await mercuriusClient.mutate(
			Mutation_createAgendaCategory,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						eventId: otherOrgEvent.eventId,
						name: "Foreign Category",
						description: "Different event category",
					},
				},
			},
		);

		const foreignCategoryId = foreignCategoryRes.data?.createAgendaCategory?.id;
		assertToBeNonNullish(foreignCategoryId);

		// Sanity check (events differ)
		expect(otherOrgEvent.eventId).not.toBe(itemEventId);
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					categoryId: foreignCategoryId,
				},
			},
		});

		expect(result.data?.updateAgendaItem ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "categoryId"],
								message: expect.stringContaining(
									"does not belong to the event",
								),
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should throw unexpected error when update returns nothing", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;

		// Mock required: This edge case (update returning empty array) cannot be
		// reproduced with real DB constraints. The mock ensures branch coverage
		// for the defensive check after agenda item update.
		const transactionSpy = vi
			.spyOn(server.drizzleClient, "transaction")
			.mockImplementation(async (callback) => {
				const mockTx = {
					...server.drizzleClient,
					update: vi.fn().mockImplementation(() => ({
						set: vi.fn().mockReturnThis(),
						where: vi.fn().mockReturnThis(),
						returning: vi.fn().mockResolvedValue([]),
					})),
					delete: vi.fn().mockReturnThis(),
					insert: vi.fn().mockReturnThis(),
				};

				return callback(mockTx as unknown as Parameters<typeof callback>[0]);
			});

		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					name: "Fail",
				},
			},
		});

		expect(transactionSpy).toHaveBeenCalled();
		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
	});

	test("should delete all URLs when url is provided as empty array", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;

		await insertAgendaItemUrls(agendaItemId, [
			"https://example.com/1",
			"https://example.com/2",
		]);
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					url: [],
				},
			},
		});

		expect(result.errors).toBeUndefined();

		const urlsAfter = await server.drizzleClient
			.select()
			.from(agendaItemUrlTable)
			.where(eq(agendaItemUrlTable.agendaItemId, agendaItemId));

		expect(urlsAfter).toHaveLength(0);
	});

	test("should replace URLs when non-empty url array is provided", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;

		await insertAgendaItemUrls(agendaItemId, [
			"https://old.com/1",
			"https://old.com/2",
		]);

		const newUrls = ["https://new.com/a", "https://new.com/b"];
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					url: newUrls.map((url) => ({ url })),
				},
			},
		});

		expect(result.errors).toBeUndefined();

		const urlsAfter = await server.drizzleClient
			.select()
			.from(agendaItemUrlTable)
			.where(eq(agendaItemUrlTable.agendaItemId, agendaItemId));

		expect(urlsAfter).toHaveLength(2);
		expect(urlsAfter.map((u) => u.url).sort()).toEqual(newUrls.sort());
	});

	test("should not modify URLs when url input is omitted", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;

		const initialUrls = ["https://keep.com/1", "https://keep.com/2"];

		await insertAgendaItemUrls(agendaItemId, initialUrls);
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					name: "Updated name only",
				},
			},
		});

		expect(result.errors).toBeUndefined();

		const urlsAfter = await server.drizzleClient
			.select()
			.from(agendaItemUrlTable)
			.where(eq(agendaItemUrlTable.agendaItemId, agendaItemId));

		expect(urlsAfter).toHaveLength(2);
		expect(urlsAfter.map((u) => u.url).sort()).toEqual(initialUrls.sort());
	});

	test("should update notes successfully", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;
		const { token } = await getAdminAuth();
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					notes: "These are updated notes",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaItem).toEqual(
			expect.objectContaining({
				id: agendaItemId,
				notes: "These are updated notes",
			}),
		);

		const itemInDb =
			await server.drizzleClient.query.agendaItemsTable.findFirst({
				columns: { notes: true },
				where: (fields, operators) => operators.eq(fields.id, agendaItemId),
			});

		assertToBeNonNullish(itemInDb);
		expect(itemInDb.notes).toBe("These are updated notes");
	});

	test("should set notes to null when explicitly provided as null", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;
		const { token } = await getAdminAuth();
		// first set notes
		await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					notes: "Initial notes",
				},
			},
		});
		// now clear notes
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					notes: null,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaItem?.notes).toBeNull();

		const itemInDb =
			await server.drizzleClient.query.agendaItemsTable.findFirst({
				columns: { notes: true },
				where: (fields, operators) => operators.eq(fields.id, agendaItemId),
			});

		assertToBeNonNullish(itemInDb);
		expect(itemInDb.notes).toBeNull();
	});

	test("should not modify notes when notes field is omitted", async () => {
		const env = await createCategoryFolderAgendaItem();
		cleanupFns.push(env.cleanup);

		const agendaItemId = env.agendaItemId;
		const { token } = await getAdminAuth();
		// set initial notes
		await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					notes: "Keep this note",
				},
			},
		});
		// update something else
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: agendaItemId,
					name: "Updated name only",
				},
			},
		});

		expect(result.errors).toBeUndefined();

		const itemInDb =
			await server.drizzleClient.query.agendaItemsTable.findFirst({
				columns: { notes: true },
				where: (fields, operators) => operators.eq(fields.id, agendaItemId),
			});

		assertToBeNonNullish(itemInDb);
		expect(itemInDb.notes).toBe("Keep this note");
	});
});
