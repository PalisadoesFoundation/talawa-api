import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
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
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_agendaCategoriesByEventId,
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
const adminAuthToken = signInResult.data.signIn.authenticationToken;
const adminUserId = signInResult.data.signIn.user?.id;

assertToBeNonNullish(adminAuthToken);
assertToBeNonNullish(adminUserId);

suite("Query field agendaCategoriesByEventId", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of cleanupFns.reverse()) {
			await cleanup();
		}
		cleanupFns.length = 0;
	});

	test("Returns unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.query(
			Query_agendaCategoriesByEventId,
			{
				variables: {
					eventId: faker.string.uuid(),
				},
			},
		);

		expect(result.data?.agendaCategoriesByEventId ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["agendaCategoriesByEventId"],
				}),
			]),
		);
	});

	test("Returns unauthenticated error when user is deleted after authentication", async () => {
		const regularUser = await createRegularUserUsingAdmin();
		let eventId: string | undefined;

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { name: "Org", countryCode: "us" },
				},
			},
		);
		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;
		cleanupFns.push(async () => {
			if (eventId) {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			}

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Event",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 10000).toISOString(),
					},
				},
			},
		);
		assertToBeNonNullish(createEventResult.data?.createEvent);
		eventId = createEventResult.data.createEvent.id;

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, regularUser.userId));

		const result = await mercuriusClient.query(
			Query_agendaCategoriesByEventId,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: { eventId },
			},
		);

		expect(result.data?.agendaCategoriesByEventId ?? null).toEqual(null);
		expect(
			result.errors?.some((e) => e.extensions?.code === "unauthenticated"),
		).toBe(true);
	});

	test("Returns invalid_arguments for invalid eventId UUID", async () => {
		const result = await mercuriusClient.query(
			Query_agendaCategoriesByEventId,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					eventId: "invalid-uuid",
				},
			},
		);

		expect(result.data?.agendaCategoriesByEventId ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({ argumentPath: ["eventId"] }),
						]),
					}),
					path: ["agendaCategoriesByEventId"],
				}),
			]),
		);
	});

	test("Returns not_found when event does not exist", async () => {
		const result = await mercuriusClient.query(
			Query_agendaCategoriesByEventId,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					eventId: faker.string.uuid(),
				},
			},
		);

		expect(result.data?.agendaCategoriesByEventId ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["eventId"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("Returns unauthorized when non-member tries to access agenda categories", async () => {
		const regularUser = await createRegularUserUsingAdmin();
		let eventId: string | undefined;

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;
		cleanupFns.push(async () => {
			if (eventId) {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			}

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Test Event",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 3600000).toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		eventId = createEventResult.data.createEvent.id;

		const result = await mercuriusClient.query(
			Query_agendaCategoriesByEventId,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: { eventId },
			},
		);

		expect(result.data?.agendaCategoriesByEventId ?? null).toEqual(null);
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

	test("Returns empty array when event has no agenda categories", async () => {
		let eventId: string | undefined;
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;
		cleanupFns.push(async () => {
			if (eventId) {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			}

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Event without categories",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 3600000).toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		eventId = createEventResult.data.createEvent.id;

		const result = await mercuriusClient.query(
			Query_agendaCategoriesByEventId,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { eventId },
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.agendaCategoriesByEventId).toEqual([]);
	});

	test("Returns agenda categories for event", async () => {
		let eventId: string | undefined;
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization);
		const organizationId = createOrgResult.data.createOrganization.id;
		cleanupFns.push(async () => {
			if (eventId) {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			}

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId,
					role: "administrator",
				},
			},
		});

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Event with categories",
						organizationId,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 3600000).toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		eventId = createEventResult.data.createEvent.id;

		await mercuriusClient.mutate(Mutation_createAgendaCategory, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					eventId,
					name: "Category 1",
					description: "Desc 1",
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createAgendaCategory, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					eventId,
					name: "Category 2",
					description: "Desc 2",
				},
			},
		});

		const result = await mercuriusClient.query(
			Query_agendaCategoriesByEventId,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { eventId },
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.agendaCategoriesByEventId).toHaveLength(2);
		expect(result.data?.agendaCategoriesByEventId).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "Category 1" }),
				expect.objectContaining({ name: "Category 2" }),
			]),
		);
	});
});
