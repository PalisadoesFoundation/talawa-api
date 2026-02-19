import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	MUTATION_updateAgendaItemSequence,
	Mutation_createAgendaCategory,
	Mutation_createAgendaFolder,
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_currentUser,
} from "../documentNodes";

let authToken: string;
let adminUser: { id: string };

beforeAll(async () => {
	const { accessToken } = await getAdminAuthViaRest(server);
	authToken = accessToken;
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	assertToBeNonNullish(currentUserResult.data?.currentUser);
	adminUser = { id: currentUserResult.data.currentUser.id };
});

async function createAgendaItem() {
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
				name: "Event",
				startAt: new Date(Date.now() + 5_000).toISOString(),
				endAt: new Date(Date.now() + 3_600_000).toISOString(),
			},
		},
	});

	const eventId = eventRes.data?.createEvent?.id;
	assertToBeNonNullish(eventId);

	const categoryRes = await mercuriusClient.mutate(
		Mutation_createAgendaCategory,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					eventId,
					name: "Category",
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

	const itemRes = await mercuriusClient.mutate(Mutation_createAgendaItem, {
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
	});

	const agendaItemId = itemRes.data?.createAgendaItem?.id;
	assertToBeNonNullish(agendaItemId);

	return { agendaItemId, organizationId: orgId };
}

suite("Mutation.updateAgendaItemSequence", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("should update agenda item sequence successfully", async () => {
		const { agendaItemId } = await createAgendaItem();

		const result = await mercuriusClient.mutate(
			MUTATION_updateAgendaItemSequence,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: agendaItemId,
						sequence: 10,
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateAgendaItemSequence).toEqual({
			id: agendaItemId,
			sequence: 10,
		});
	});

	test("should throw unauthenticated error when not logged in", async () => {
		const result = await mercuriusClient.mutate(
			MUTATION_updateAgendaItemSequence,
			{
				variables: {
					input: {
						id: faker.string.uuid(),
						sequence: 2,
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw invalid_arguments for invalid input", async () => {
		const result = await mercuriusClient.mutate(
			MUTATION_updateAgendaItemSequence,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "invalid-id",
						sequence: -1,
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should throw arguments_associated_resources_not_found when agenda item does not exist", async () => {
		const result = await mercuriusClient.mutate(
			MUTATION_updateAgendaItemSequence,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						sequence: 3,
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("should throw unauthorized_action_on_arguments_associated_resources for non-admin user", async () => {
		const { agendaItemId, organizationId } = await createAgendaItem();

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
		const userId = userRes.data?.createUser?.user?.id;
		assertToBeNonNullish(userToken);
		assertToBeNonNullish(userId);

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId,
					memberId: userId,
					role: "regular",
				},
			},
		});

		const result = await mercuriusClient.mutate(
			MUTATION_updateAgendaItemSequence,
			{
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: agendaItemId,
						sequence: 5,
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("should throw unexpected error when update returns nothing", async () => {
		const { agendaItemId } = await createAgendaItem();

		const txSpy = vi
			.spyOn(server.drizzleClient, "update")
			.mockImplementationOnce(
				() =>
					({
						set: vi.fn().mockReturnThis(),
						where: vi.fn().mockReturnThis(),
						returning: vi.fn().mockResolvedValue([]),
					}) as never,
			);

		const result = await mercuriusClient.mutate(
			MUTATION_updateAgendaItemSequence,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: agendaItemId,
						sequence: 99,
					},
				},
			},
		);

		expect(txSpy).toHaveBeenCalled();
		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
	});
});
