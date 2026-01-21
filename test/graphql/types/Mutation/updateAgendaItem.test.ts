import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
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

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);
const adminUser = signInResult.data.signIn.user;

async function createOrganizationAndEvent() {
	const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});
	const orgId = orgRes.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	assertToBeNonNullish(adminUser);
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId: orgId,
				memberId: adminUser.id,
				role: "administrator",
			},
		},
	});

	const eventRes = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId: orgId,
				name: "Test Event",
				description: "Agenda Event",
				startAt: new Date(Date.now() + 60000).toISOString(),
				endAt: new Date(Date.now() + 3600000).toISOString(),
				location: "Test Location",
			},
		},
	});

	const eventId = eventRes.data?.createEvent?.id;
	assertToBeNonNullish(eventId);

	return { orgId, eventId };
}

async function createCategoryFolderAgendaItem() {
	const { orgId, eventId } = await createOrganizationAndEvent();
	assertToBeNonNullish(adminUser);

	const categoryRes = await mercuriusClient.mutate(
		Mutation_createAgendaCategory,
		{
			headers: { authorization: `bearer ${authToken}` },
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
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				eventId,
				organizationId: orgId,
				name: "Folder",
				sequence: 1,
			},
		},
	});

	const folderId = folderRes.data?.createAgendaFolder?.id;
	assertToBeNonNullish(folderId);

	const agendaItemRes = await mercuriusClient.mutate(
		Mutation_createAgendaItem,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: "Agenda Item",
					type: "general",
					eventId,
					folderId,
					categoryId,
					sequence: 1,
				},
			},
		},
	);

	const agendaItemId = agendaItemRes.data?.createAgendaItem?.id;
	assertToBeNonNullish(agendaItemId);

	return { orgId, eventId, folderId, categoryId, agendaItemId };
}

suite("Mutation field updateAgendaItem", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("should update agenda item successfully", async () => {
		const { agendaItemId } = await createCategoryFolderAgendaItem();

		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${authToken}` },
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
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${authToken}` },
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
		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${authToken}` },
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
		const { agendaItemId } = await createCategoryFolderAgendaItem();

		// Force type to "note" directly
		await server.drizzleClient
			.update(agendaItemsTable)
			.set({ type: "note" })
			.where(eq(agendaItemsTable.id, agendaItemId));

		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${authToken}` },
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
		const { agendaItemId } = await createCategoryFolderAgendaItem();

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${authToken}` },
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
		const { agendaItemId } = await createCategoryFolderAgendaItem();

		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: agendaItemId,
					attachments: [
						{
							name: "file.png",
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
					name: "file.png",
					mimeType: "IMAGE_PNG",
				}),
			]),
		);
	});

	test("should throw unexpected error when update returns nothing", async () => {
		const { agendaItemId } = await createCategoryFolderAgendaItem();

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

		const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
			headers: { authorization: `bearer ${authToken}` },
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
});
