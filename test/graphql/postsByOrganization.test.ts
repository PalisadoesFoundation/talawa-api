import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../helpers";
import { server } from "../../server";
import { mercuriusClient } from "./client";
import {
    Mutation_createOrganization,
    Mutation_createPost,
    Mutation_deleteOrganization,
    Mutation_signUp,
    Query_postsByOrganization,
} from "./documentNodes";

let authToken: string;
let userId: string;
const cleanupFns: Array<() => Promise<void>> = [];

beforeAll(async () => {
    const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
        variables: {
            input: {
                emailAddress: `test-${faker.string.uuid()}@example.com`,
                password: "TestPassword123!",
                name: "Test User",
                selectedOrganization: server.envConfig.API_ADMINISTRATOR_ORGANIZATION_ID,
            },
        },
    });
    assertToBeNonNullish(signUpResult.data?.signUp);
    authToken = signUpResult.data.signUp.authenticationToken;
    assertToBeNonNullish(signUpResult.data.signUp.user);
    userId = signUpResult.data.signUp.user.id;
});

afterEach(async () => {
    for (const cleanup of cleanupFns.reverse()) {
        try {
            await cleanup();
        } catch (error) {
            console.error("Cleanup failed:", error);
        }
    }
    cleanupFns.length = 0;
});

suite("Query field postsByOrganization", () => {
    suite("Authentication", () => {
        test("returns error when user is unauthenticated", async () => {
            const result = await mercuriusClient.query(Query_postsByOrganization, {
                variables: {
                    input: {
                        organizationId: faker.string.uuid(),
                    },
                },
            });

            expect(result.data?.postsByOrganization).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({ code: "unauthenticated" }),
                        path: ["postsByOrganization"],
                    }),
                ]),
            );
        });
    });

    suite("Sorting", () => {
        test("returns posts sorted by createdAt in descending order", async () => {
            // Create organization
            const orgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Test Org ${faker.string.uuid()}`,
                            countryCode: "US",
                        },
                    },
                },
            );
            const orgId = orgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);
            cleanupFns.push(async () => {
                await mercuriusClient.mutate(Mutation_deleteOrganization, {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: { input: { id: orgId } },
                });
            });

            // Create posts
            await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "First Post",
                        attachments: [],
                    },
                },
            });

            await new Promise((resolve) => setTimeout(resolve, 100));

            await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "Second Post",
                        attachments: [],
                    },
                },
            });

            const result = await mercuriusClient.query(Query_postsByOrganization, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        sortOrder: "DESC",
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.postsByOrganization).toHaveLength(2);
            expect(result.data?.postsByOrganization[0].caption).toBe("Second Post");
            expect(result.data?.postsByOrganization[1].caption).toBe("First Post");
        });

        test("returns posts sorted by createdAt in ascending order", async () => {
            const orgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Test Org ${faker.string.uuid()}`,
                            countryCode: "US",
                        },
                    },
                },
            );
            const orgId = orgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);
            cleanupFns.push(async () => {
                await mercuriusClient.mutate(Mutation_deleteOrganization, {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: { input: { id: orgId } },
                });
            });

            await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "First Post",
                        attachments: [],
                    },
                },
            });

            await new Promise((resolve) => setTimeout(resolve, 100));

            await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "Second Post",
                        attachments: [],
                    },
                },
            });

            const result = await mercuriusClient.query(Query_postsByOrganization, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        sortOrder: "ASC",
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.postsByOrganization).toHaveLength(2);
            expect(result.data?.postsByOrganization[0].caption).toBe("First Post");
            expect(result.data?.postsByOrganization[1].caption).toBe("Second Post");
        });
    });

    suite("Empty Results", () => {
        test("returns empty array when organization has no posts", async () => {
            const orgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Empty Org ${faker.string.uuid()}`,
                            countryCode: "US",
                        },
                    },
                },
            );
            const orgId = orgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);
            cleanupFns.push(async () => {
                await mercuriusClient.mutate(Mutation_deleteOrganization, {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: { input: { id: orgId } },
                });
            });

            const result = await mercuriusClient.query(Query_postsByOrganization, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.postsByOrganization).toEqual([]);
        });
    });
});