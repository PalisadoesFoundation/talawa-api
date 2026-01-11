import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaCategory,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";

let cachedAdminAuth: {
	token: string;
	userId: string;
} | null = null;

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

async function createOrganizationAndEvent(
	adminAuthToken: string,
	adminUserId: string,
) {
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
				startAt: new Date(Date.now() + 86400000).toISOString(),
				endAt: new Date(Date.now() + 90000000).toISOString(),
				description: "Agenda category test event",
			},
		},
	});

	assertToBeNonNullish(eventResult.data?.createEvent);
	const eventId = eventResult.data.createEvent.id;

	return {
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

suite("Mutation field createAgendaCategory", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();

		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch (error) {
				if (process.env.DEBUG_TEST_CLEANUP === "true") {
					console.error("Cleanup failed:", error);
				}
			}
		}
		testCleanupFunctions.length = 0;
	});

	suite("Authorization and Authentication", () => {
		test("Returns error when client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createAgendaCategory,
				{
					variables: {
						input: {
							eventId: faker.string.uuid(),
							name: "Category",
						},
					},
				},
			);

			expect(result.data?.createAgendaCategory ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["createAgendaCategory"],
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("Allows organization admin to create category", async () => {
			const [{ token }, orgAdmin] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(token, await getAdminUserId());
			testCleanupFunctions.push(cleanup);

			// Make user an org admin (not super admin)
			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: orgAdmin.userId,
				organizationId,
				role: "administrator",
			});

			const result = await mercuriusClient.mutate(
				Mutation_createAgendaCategory,
				{
					headers: { authorization: `bearer ${orgAdmin.authToken}` },
					variables: {
						input: {
							eventId,
							name: "Org Admin Category",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createAgendaCategory);
		});

		test("Returns error when user exists in token but not in DB", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(
				Mutation_createAgendaCategory,
				{
					headers: {
						authorization: `bearer ${regularUser.authToken}`,
					},
					variables: {
						input: {
							eventId: faker.string.uuid(),
							name: "Category",
						},
					},
				},
			);

			expect(result.data.createAgendaCategory).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["createAgendaCategory"],
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		test("Returns error for invalid arguments", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(
				Mutation_createAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							eventId: "not-a-uuid",
							name: "Valid Name",
						},
					},
				},
			);

			expect(result.data?.createAgendaCategory ?? null).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["createAgendaCategory"],
						extensions: expect.objectContaining({
							code: "invalid_arguments",
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
	});

	suite("Resource Existence", () => {
		test("Returns error when event does not exist", async () => {
			const { token } = await getAdminAuth();

			const result = await mercuriusClient.mutate(
				Mutation_createAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							eventId: faker.string.uuid(),
							name: "Category",
						},
					},
				},
			);

			expect(result.data.createAgendaCategory).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["createAgendaCategory"],
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
	});

	suite("Authorization Logic", () => {
		test("Returns error when regular org member tries to create category", async () => {
			const [{ token }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(token, await getAdminUserId());

			testCleanupFunctions.push(cleanup);

			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: regularUser.userId,
				organizationId,
				role: "regular",
			});

			const result = await mercuriusClient.mutate(
				Mutation_createAgendaCategory,
				{
					headers: {
						authorization: `bearer ${regularUser.authToken}`,
					},
					variables: {
						input: {
							eventId,
							name: "Category",
						},
					},
				},
			);

			expect(result.data.createAgendaCategory).toEqual(null);
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

		test("Allows super admin without organization membership", async () => {
			const { token } = await getAdminAuth();

			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);

			assertToBeNonNullish(orgResult.data?.createOrganization);
			const organizationId = orgResult.data.createOrganization.id;
			const regularUser = await createRegularUserUsingAdmin();

			await addOrganizationMembership({
				adminAuthToken: token,
				memberId: regularUser.userId,
				organizationId,
				role: "administrator",
			});

			const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Event",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 10000).toISOString(),
						description: "test",
					},
				},
			});
			assertToBeNonNullish(eventResult.data?.createEvent);
			const eventId = eventResult.data.createEvent.id;

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: eventId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: organizationId } },
				});
			});

			const result = await mercuriusClient.mutate(
				Mutation_createAgendaCategory,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: {
							eventId,
							name: "Category",
						},
					},
				},
			);

			assertToBeNonNullish(result.data?.createAgendaCategory);
			expect(result.errors).toBeUndefined();
		});
	});

	test("Returns unexpected error when insert returns empty array", async () => {
		const { token } = await getAdminAuth();

		const { cleanup, eventId } = await createOrganizationAndEvent(
			token,
			await getAdminUserId(),
		);

		testCleanupFunctions.push(cleanup);

		vi.spyOn(server.drizzleClient, "insert").mockReturnValueOnce({
			values: () => ({
				returning: async () => [],
			}),
		} as unknown as ReturnType<typeof server.drizzleClient.insert>);

		const result = await mercuriusClient.mutate(Mutation_createAgendaCategory, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					eventId,
					name: "Category",
				},
			},
		});

		expect(result.data?.createAgendaCategory ?? null).toEqual(null);
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
