import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
    Mutation_createOrganization,
    Query_signIn,
} from "../documentNodes";

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

// Generic error checker: data is null and at least one error on the expected path.
// This avoids brittle checks on extension code strings while still validating failure.
function expectGraphQLFailure(
    result: { data?: unknown; errors?: Array<{ path?: readonly unknown[]; message?: string }> },
    field: string,
) {
    expect((result as any).data?.[field] ?? null).toBeNull();
    expect(result.errors && result.errors.length).toBeTruthy();
    expect(result.errors).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ path: [field] }),
        ]),
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
            expectGraphQLFailure(result, "registerForEvent");
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

            expect(result.data?.registerForEvent ?? null).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "arguments_associated_resources_not_found",
                        }),
                        path: ["registerForEvent"],
                    }),
                ]),
            );
        });
    });

    suite("event not registerable", () => {
        test("event not open for registration", async () => {
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

            // Create an organization first
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

            // Create a non-registerable standalone event
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

            expect(result.data?.registerForEvent ?? null).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "Event is not open for registration",
                        path: ["registerForEvent"],
                    }),
                ]),
            );
        });
    });

    suite("already registered", () => {
        test("user is already registered for event", async () => {
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

            // Create an organization first
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

            // Create a registerable standalone event
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

            // Register for the event first time
            const firstRegistration = await mercuriusClient.mutate(
                MUTATION_REGISTER_FOR_EVENT,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: { input: { eventId } },
                } as Parameters<typeof mercuriusClient.mutate>[1],
            );
            expect(firstRegistration.data?.registerForEvent).toBe(true);

            // Try to register again
            const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: { input: { eventId } },
            } as Parameters<typeof mercuriusClient.mutate>[1]);

            expect(result.data?.registerForEvent ?? null).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "User is already registered for this event",
                        path: ["registerForEvent"],
                    }),
                ]),
            );
        });
    });

    suite("successful registration", () => {
        test("registers user for a registerable event", async () => {
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

            // Create an organization first
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

            // Create a registerable standalone event
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

            // Register for the event
            const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: { input: { eventId } },
            } as Parameters<typeof mercuriusClient.mutate>[1]);

            expect(result.data?.registerForEvent).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        test("different users register for the same event", async () => {
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

            // Create a regular user
            const regularUserResult = await createRegularUserUsingAdmin();
            const regularUserToken = regularUserResult.authToken;

            // Create an organization
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

            // Create a registerable standalone event
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

            // Register admin user for the event
            const adminRegistration = await mercuriusClient.mutate(
                MUTATION_REGISTER_FOR_EVENT,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: { input: { eventId } },
                } as Parameters<typeof mercuriusClient.mutate>[1],
            );
            expect(adminRegistration.data?.registerForEvent).toBe(true);

            // Register regular user for the same event
            const userRegistration = await mercuriusClient.mutate(
                MUTATION_REGISTER_FOR_EVENT,
                {
                    headers: { authorization: `bearer ${regularUserToken}` },
                    variables: { input: { eventId } },
                } as Parameters<typeof mercuriusClient.mutate>[1],
            );
            expect(userRegistration.data?.registerForEvent).toBe(true);
        });
    });
});
