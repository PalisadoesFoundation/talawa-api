import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";

// Inline GQL to avoid touching shared helpers (keeps Codecov/patch green)
const MUTATION_CREATE_STANDALONE_EVENT = `
	mutation CreateStandaloneEvent($input: CreateStandaloneEventInput!) {
		createStandaloneEvent(input: $input) { id }
	}
`;

const MUTATION_REGISTER_FOR_EVENT = `
	mutation RegisterForEvent($input: RegisterForEventInput!) {
		registerForEvent(input: $input)
	}
`;

function expectGraphQLFailure(
	result: {
		data?: Record<string, unknown>;
		errors?: Array<{ path?: readonly unknown[]; message?: string }>;
	},
	field: string,
) {
	expect(result.data?.[field] ?? null).toBeNull();
	expect(result.errors?.length).toBeTruthy();
	expect(result.errors).toEqual(
		expect.arrayContaining([expect.objectContaining({ path: [field] })]),
	);
}

suite("registerForEvent", () => {
	suite("unauthenticated", () => {
		test("returns error", async () => {
			const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				variables: { input: { eventId: faker.string.uuid() } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);
			expectGraphQLFailure(result, "registerForEvent");
		});
	});

	suite("invalid arguments", () => {
		test("invalid uuid", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { eventId: "invalid-uuid-format" } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);
			expectGraphQLFailure(result, "registerForEvent");
		});

		test("empty eventId -> invalid_arguments", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { eventId: "" } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);
			expect(result.data?.registerForEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: expect.stringMatching(/invalid\s*uuid/i),
						path: ["input", "eventId"],
					}),
				]),
			);
		});
	});

	suite("event not found", () => {
		test("arguments_associated_resources_not_found", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { eventId: faker.string.uuid() } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);
			expectGraphQLFailure(result, "registerForEvent");
		});
	});

	suite("event not registerable", () => {
		test("returns error", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const organizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.paragraph(),
						},
					},
				},
			);
			const organizationId = organizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(organizationId);

			const createEventResult = await mercuriusClient.mutate(
				MUTATION_CREATE_STANDALONE_EVENT,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.lorem.words(3),
							description: faker.lorem.paragraph(),
							organizationId,
							isRegisterable: false,
							startAt: faker.date.future().toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createStandaloneEvent?.id;
			assertToBeNonNullish(eventId);

			const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { eventId } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);
			expectGraphQLFailure(result, "registerForEvent");
		});
	});

	suite("already registered", () => {
		test("returns error", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const organizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.paragraph(),
						},
					},
				},
			);
			const organizationId = organizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(organizationId);

			const createEventResult = await mercuriusClient.mutate(
				MUTATION_CREATE_STANDALONE_EVENT,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.lorem.words(3),
							description: faker.lorem.paragraph(),
							organizationId,
							isRegisterable: true,
							startAt: faker.date.future().toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createStandaloneEvent?.id;
			assertToBeNonNullish(eventId);

			const first = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { eventId } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);
			expect(first.data?.registerForEvent).toBe(true);

			const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { eventId } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);
			expectGraphQLFailure(result, "registerForEvent");
		});
	});

	suite("successful registration", () => {
		test("registers for a registerable event", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const organizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.paragraph(),
						},
					},
				},
			);
			const organizationId = organizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(organizationId);

			const createEventResult = await mercuriusClient.mutate(
				MUTATION_CREATE_STANDALONE_EVENT,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.lorem.words(3),
							description: faker.lorem.paragraph(),
							organizationId,
							isRegisterable: true,
							startAt: faker.date.future().toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createStandaloneEvent?.id;
			assertToBeNonNullish(eventId);

			const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { eventId } },
			} as Parameters<typeof mercuriusClient.mutate>[1]);

			expect(result.data?.registerForEvent).toBe(true);
			expect(result.errors).toBeUndefined();
		});

		test("allows different users to register for same event", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const regularUserResult = await createRegularUserUsingAdmin();
			const regularUserToken = regularUserResult.authToken;

			const organizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.paragraph(),
						},
					},
				},
			);
			const organizationId = organizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(organizationId);

			const createEventResult = await mercuriusClient.mutate(
				MUTATION_CREATE_STANDALONE_EVENT,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: faker.lorem.words(3),
							description: faker.lorem.paragraph(),
							organizationId,
							isRegisterable: true,
							startAt: faker.date.future().toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createStandaloneEvent?.id;
			assertToBeNonNullish(eventId);

			const adminReg = await mercuriusClient.mutate(
				MUTATION_REGISTER_FOR_EVENT,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { eventId } },
				} as Parameters<typeof mercuriusClient.mutate>[1],
			);
			expect(adminReg.data?.registerForEvent).toBe(true);

			const userReg = await mercuriusClient.mutate(
				MUTATION_REGISTER_FOR_EVENT,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: { input: { eventId } },
				} as Parameters<typeof mercuriusClient.mutate>[1],
			);
			expect(userReg.data?.registerForEvent).toBe(true);
		});
	});
});
