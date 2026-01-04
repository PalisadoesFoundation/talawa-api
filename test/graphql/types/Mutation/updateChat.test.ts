import { faker } from "@faker-js/faker";
import gql from "graphql-tag";
import { expect, suite, test, vi } from "vitest";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";

const Mutation_updateChat = gql(`
  mutation Mutation_updateChat($input: MutationUpdateChatInput!) {
    updateChat(input: $input) {
      id
      name
      description
    }
  }
`);

async function createTestOrganization(): Promise<string> {
	const signIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	expect(signIn.errors ?? []).toEqual([]);

	const token = signIn.data?.signIn?.authenticationToken;
	expect(token).toBeDefined();

	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Org-${Date.now()}`,
				countryCode: "us",
				isUserRegistrationRequired: true,
			},
		},
	});

	expect(org.errors ?? []).toEqual([]);

	const orgId = org.data?.createOrganization?.id;
	expect(orgId).toBeDefined();

	return orgId as string;
}

suite("updateChat mutation", () => {
	test("returns unauthenticated when user is not logged in", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "New Name",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
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

	test("returns invalid_arguments for malformed input", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: "",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
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

	test("returns resource not found when chat does not exist", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "New Name",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
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

	test("returns unauthorized when user is not chat or org admin", async () => {
		const creator = await createRegularUserUsingAdmin();
		const outsider = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Chat",
			organizationId: orgId,
			creatorId: creator.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${outsider.authToken}` },
			variables: {
				input: {
					id: chatId,
					name: "Hack",
				},
			},
		});

		expect(result.data?.updateChat ?? null).toBeNull();
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

	test("successfully updates chat when user is organization administrator", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const chatId = faker.string.uuid();

		await server.drizzleClient.insert(chatsTable).values({
			id: chatId,
			name: "Old",
			organizationId: orgId,
			creatorId: user.userId,
		});

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					id: chatId,
					name: "Updated",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateChat.name).toBe("Updated");
	});

	test("returns unexpected when update returns undefined", async () => {
		const user = await createRegularUserUsingAdmin();

		vi.spyOn(server.drizzleClient, "transaction").mockImplementationOnce(
			async () => {
				throw new Error("unexpected");
			},
		);

		const result = await mercuriusClient.mutate(Mutation_updateChat, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Fail",
				},
			},
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

		vi.restoreAllMocks();
	});
});
