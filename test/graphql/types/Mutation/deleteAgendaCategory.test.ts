import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";

import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaCategory,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteAgendaCategory,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";

let cachedAdminAuth: { token: string; userId: string } | null = null;

async function getAdminAuth() {
	if (cachedAdminAuth) return cachedAdminAuth;

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

async function createOrganizationEventAndCategory(adminAuthToken: string) {
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
				description: "Agenda category test event",
			},
		},
	});

	assertToBeNonNullish(eventResult.data?.createEvent);
	const eventId = eventResult.data.createEvent.id;

	const categoryResult = await mercuriusClient.mutate(
		Mutation_createAgendaCategory,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					eventId,
					name: "Test Category",
					description: "Test description",
				},
			},
		},
	);

	assertToBeNonNullish(categoryResult.data?.createAgendaCategory);
	const categoryId = categoryResult.data.createAgendaCategory.id;

	return {
		categoryId,
		organizationId,
		eventId,
		cleanup: async () => {
			// Best-effort: delete category first to avoid relying on FK cascade.
			await mercuriusClient.mutate(Mutation_deleteAgendaCategory, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: categoryId } },
			});
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

suite("Mutation field deleteAgendaCategory", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const cleanup of cleanupFns.reverse()) {
			await cleanup();
		}
		cleanupFns.length = 0;
		mercuriusClient.setHeaders({});
	});

	suite("Authorization and Authentication", () => {
		test("Returns unauthenticated when client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteAgendaCategory,
				{
					variables: { input: { id: faker.string.uuid() } },
				},
			);

			expect(result.data?.deleteAgendaCategory).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						path: ["deleteAgendaCategory"],
					}),
				]),
			);
		});

		test("Returns unauthenticated when user in token does not exist", async () => {
			const user = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, user.userId));

			const result = await mercuriusClient.mutate(
				Mutation_deleteAgendaCategory,
				{
					headers: { authorization: `bearer ${user.authToken}` },
					variables: { input: { id: faker.string.uuid() } },
				},
			);

			expect(result.data.deleteAgendaCategory).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						path: ["deleteAgendaCategory"],
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		test("Returns invalid_arguments for invalid UUID", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(
				Mutation_deleteAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							id: "invalid-uuid",
						},
					},
				},
			);

			expect(result.data?.deleteAgendaCategory ?? null).toEqual(null);
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
				Mutation_deleteAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: faker.string.uuid() } },
				},
			);

			expect(result.data.deleteAgendaCategory).toEqual(null);
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
						path: ["deleteAgendaCategory"],
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

			const env = await createOrganizationEventAndCategory(token);
			cleanupFns.push(env.cleanup);

			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: regularUser.userId,
				organizationId: env.organizationId,
				role: "regular",
			});

			const result = await mercuriusClient.mutate(
				Mutation_deleteAgendaCategory,
				{
					headers: { authorization: `bearer ${regularUser.authToken}` },
					variables: { input: { id: env.categoryId } },
				},
			);

			expect(result.data.deleteAgendaCategory).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						extensions:
							expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
								{
									code: "unauthorized_action_on_arguments_associated_resources",
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

	suite("Successful Deletion", () => {
		test("Deletes agenda category successfully as admin", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndCategory(token);
			cleanupFns.push(env.cleanup);

			const result = await mercuriusClient.mutate(
				Mutation_deleteAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: env.categoryId } },
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteAgendaCategory);
			expect(result.data.deleteAgendaCategory.id).toEqual(env.categoryId);
		});

		test("Deletes agenda category successfully as org admin", async () => {
			const [{ token }, orgAdmin] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const env = await createOrganizationEventAndCategory(token);
			cleanupFns.push(env.cleanup);

			// Make the regular user an org admin
			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: orgAdmin.userId,
				organizationId: env.organizationId,
				role: "administrator",
			});

			const result = await mercuriusClient.mutate(
				Mutation_deleteAgendaCategory,
				{
					headers: { authorization: `bearer ${orgAdmin.authToken}` },
					variables: { input: { id: env.categoryId } },
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteAgendaCategory);
			expect(result.data.deleteAgendaCategory.id).toEqual(env.categoryId);
		});

		test("Returns error when deleting same category twice", async () => {
			const { token } = await getAdminAuth();

			const env = await createOrganizationEventAndCategory(token);
			cleanupFns.push(env.cleanup);

			await mercuriusClient.mutate(Mutation_deleteAgendaCategory, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: env.categoryId } },
			});

			const secondResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: env.categoryId } },
				},
			);

			expect(secondResult.data?.deleteAgendaCategory ?? null).toEqual(null);
			expect(secondResult.errors).toEqual(
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
						path: ["deleteAgendaCategory"],
					}),
				]),
			);
		});
	});
});
