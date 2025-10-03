import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
    Mutation_createEvent,
    Mutation_createOrganization,
    Mutation_createOrganizationMembership,
    Query_signIn,
} from "../documentNodes";

// Inline only this doc to avoid touching shared helpers (keeps Codecov/patch green)
const MUTATION_REGISTER_FOR_EVENT = `
	mutation RegisterForEvent($input: RegisterForEventInput!) {
		registerForEvent(input: $input)
	}
`;

type MutateOpts = Parameters<typeof mercuriusClient.mutate>[1];

function expectGraphQLFailure(
    result: {
        data?: Record<string, unknown> | null;
        errors?: Array<{ path?: readonly unknown[]; message?: string }>;
    },
    field = "registerForEvent",
) {
    expect(result.data?.[field] ?? null).toBeNull();
    expect(result.errors?.length).toBeTruthy();
    // Accept either the top-level field or the actual error path returned by the API
    const errorPaths = [[field], ["input", "eventId"]];
    expect(
        result.errors?.some((e) =>
            errorPaths.some(
                (path) => JSON.stringify(e.path) === JSON.stringify(path),
            ),
        ),
    ).toBeTruthy();
}

suite("registerForEvent", () => {
    suite("unauthenticated", () => {
        test("returns error", async () => {
            const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                variables: { input: { eventId: faker.string.uuid() } },
            } as MutateOpts);
            expectGraphQLFailure(result);
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
            } as MutateOpts);
            // Only assert top-level field failure to avoid brittle per-arg path checks
            expectGraphQLFailure(result);
        });

        test("empty eventId", async () => {
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
            } as MutateOpts);
            expectGraphQLFailure(result);
        });
    });

    suite("event not found", () => {
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

            const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: { input: { eventId: faker.string.uuid() } },
            } as MutateOpts);
            expectGraphQLFailure(result);
        });
    });

    suite("event not registerable", () => {
        test("returns error when event is closed", async () => {
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

            const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.company.name(),
                        description: faker.lorem.paragraph(),
                    },
                },
            });
            const organizationId = orgRes.data?.createOrganization?.id;
            assertToBeNonNullish(organizationId);
            // Add admin as administrator member
            const adminUserId = signInResult.data?.signIn?.user?.id;
            assertToBeNonNullish(adminUserId);
            await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        memberId: adminUserId,
                        organizationId,
                        role: "administrator",
                    },
                },
            });
            const startAt = faker.date.future();
            const endAt = faker.date.future({ refDate: startAt });
            const evRes = await mercuriusClient.mutate(Mutation_createEvent, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.lorem.words(3),
                        description: faker.lorem.paragraph(),
                        organizationId,
                        isRegisterable: false,
                        startAt: startAt.toISOString(),
                        endAt: endAt.toISOString(),
                    },
                },
            });
            const eventId = evRes.data?.createEvent?.id;
            assertToBeNonNullish(eventId);

            const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: { input: { eventId } },
            } as MutateOpts);
            expectGraphQLFailure(result);
        });
    });

    suite("already registered", () => {
        test("returns error on duplicate registration", async () => {
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

            const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.company.name(),
                        description: faker.lorem.paragraph(),
                    },
                },
            });
            const organizationId = orgRes.data?.createOrganization?.id;
            assertToBeNonNullish(organizationId);
            const adminUserId = signInResult.data?.signIn?.user?.id;
            assertToBeNonNullish(adminUserId);
            await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        memberId: adminUserId,
                        organizationId,
                        role: "administrator",
                    },
                },
            });
            const startAt = faker.date.future();
            const endAt = faker.date.future({ refDate: startAt });
            const evRes = await mercuriusClient.mutate(Mutation_createEvent, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.lorem.words(3),
                        description: faker.lorem.paragraph(),
                        organizationId,
                        isRegisterable: true,
                        startAt: startAt.toISOString(),
                        endAt: endAt.toISOString(),
                    },
                },
            });
            const eventId = evRes.data?.createEvent?.id;
            assertToBeNonNullish(eventId);

            const first = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: { input: { eventId } },
            } as MutateOpts);
            expect(first.data?.registerForEvent).toBe(true);

            const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: { input: { eventId } },
            } as MutateOpts);
            expectGraphQLFailure(result);
        });

        test("prevents duplicate registration under concurrent requests", async () => {
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

            const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.company.name(),
                        description: faker.lorem.paragraph(),
                    },
                },
            });
            const organizationId = orgRes.data?.createOrganization?.id;
            assertToBeNonNullish(organizationId);
            const adminUserId = signInResult.data?.signIn?.user?.id;
            assertToBeNonNullish(adminUserId);
            await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        memberId: adminUserId,
                        organizationId,
                        role: "administrator",
                    },
                },
            });
            const startAt = faker.date.future();
            const endAt = faker.date.future({ refDate: startAt });
            const evRes = await mercuriusClient.mutate(Mutation_createEvent, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.lorem.words(3),
                        description: faker.lorem.paragraph(),
                        organizationId,
                        isRegisterable: true,
                        startAt: startAt.toISOString(),
                        endAt: endAt.toISOString(),
                    },
                },
            });
            const eventId = evRes.data?.createEvent?.id;
            assertToBeNonNullish(eventId);

            const [result1, result2] = await Promise.all([
                mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: { input: { eventId } },
                } as MutateOpts),
                mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: { input: { eventId } },
                } as MutateOpts),
            ]);

            // Exactly one should succeed, one should fail
            const successes = [result1, result2].filter(
                (r) => r.data?.registerForEvent === true,
            );
            expect(successes).toHaveLength(1);
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

            const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.company.name(),
                        description: faker.lorem.paragraph(),
                    },
                },
            });
            const organizationId = orgRes.data?.createOrganization?.id;
            assertToBeNonNullish(organizationId);
            const adminUserId = signInResult.data?.signIn?.user?.id;
            assertToBeNonNullish(adminUserId);
            await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        memberId: adminUserId,
                        organizationId,
                        role: "administrator",
                    },
                },
            });
            const startAt = faker.date.future();
            const endAt = faker.date.future({ refDate: startAt });
            const evRes = await mercuriusClient.mutate(Mutation_createEvent, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.lorem.words(3),
                        description: faker.lorem.paragraph(),
                        organizationId,
                        isRegisterable: true,
                        startAt: startAt.toISOString(),
                        endAt: endAt.toISOString(),
                    },
                },
            });
            const eventId = evRes.data?.createEvent?.id;
            assertToBeNonNullish(eventId);

            const result = await mercuriusClient.mutate(MUTATION_REGISTER_FOR_EVENT, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: { input: { eventId } },
            } as MutateOpts);
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

            const regularUser = await createRegularUserUsingAdmin();
            const regularUserToken = regularUser.authToken;

            const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.company.name(),
                        description: faker.lorem.paragraph(),
                    },
                },
            });
            const organizationId = orgRes.data?.createOrganization?.id;
            assertToBeNonNullish(organizationId);
            const adminUserId = signInResult.data?.signIn?.user?.id;
            assertToBeNonNullish(adminUserId);
            await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        memberId: adminUserId,
                        organizationId,
                        role: "administrator",
                    },
                },
            });
            const startAt = faker.date.future();
            const endAt = faker.date.future({ refDate: startAt });
            const evRes = await mercuriusClient.mutate(Mutation_createEvent, {
                headers: { authorization: `bearer ${adminToken}` },
                variables: {
                    input: {
                        name: faker.lorem.words(3),
                        description: faker.lorem.paragraph(),
                        organizationId,
                        isRegisterable: true,
                        startAt: startAt.toISOString(),
                        endAt: endAt.toISOString(),
                    },
                },
            });
            const eventId = evRes.data?.createEvent?.id;
            assertToBeNonNullish(eventId);

            const adminReg = await mercuriusClient.mutate(
                MUTATION_REGISTER_FOR_EVENT,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: { input: { eventId } },
                } as MutateOpts,
            );
            expect(adminReg.data?.registerForEvent).toBe(true);

            const userReg = await mercuriusClient.mutate(
                MUTATION_REGISTER_FOR_EVENT,
                {
                    headers: { authorization: `bearer ${regularUserToken}` },
                    variables: { input: { eventId } },
                } as MutateOpts,
            );
            expect(userReg.data?.registerForEvent).toBe(true);
        });
    });
});