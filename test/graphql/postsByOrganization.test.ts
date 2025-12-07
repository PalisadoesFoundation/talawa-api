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

            // Create posts and store their IDs
            const firstPostResult = await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "First Post",
                        attachments: [],
                    },
                },
            });
            const firstPostId = firstPostResult.data?.createPost?.id;
            assertToBeNonNullish(firstPostId);

            const secondPostResult = await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "Second Post",
                        attachments: [],
                    },
                },
            });
            const secondPostId = secondPostResult.data?.createPost?.id;
            assertToBeNonNullish(secondPostId);

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
            // Verify both posts are present
            const postIds = result.data?.postsByOrganization.map((p: any) => p.id);
            expect(postIds).toContain(firstPostId);
            expect(postIds).toContain(secondPostId);
            // Verify most recent post (by ID, which are sequential) is first
            expect(result.data?.postsByOrganization[0].id).toBe(secondPostId);
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

            const firstPostResult = await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "First Post",
                        attachments: [],
                    },
                },
            });
            const firstPostId = firstPostResult.data?.createPost?.id;
            assertToBeNonNullish(firstPostId);

            const secondPostResult = await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "Second Post",
                        attachments: [],
                    },
                },
            });
            const secondPostId = secondPostResult.data?.createPost?.id;
            assertToBeNonNullish(secondPostId);

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
            // Verify both posts are present
            const postIds = result.data?.postsByOrganization.map((p: any) => p.id);
            expect(postIds).toContain(firstPostId);
            expect(postIds).toContain(secondPostId);
            // Verify oldest post (by ID) is first
            expect(result.data?.postsByOrganization[0].id).toBe(firstPostId);
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

    suite("Authorization", () => {
        test("returns error when user is not a member of the organization", async () => {
            // Create a separate user who is not a member
            const nonMemberSignUp = await mercuriusClient.mutate(Mutation_signUp, {
                variables: {
                    input: {
                        emailAddress: `non-member-${faker.string.uuid()}@example.com`,
                        password: "TestPassword123!",
                        name: "Non Member User",
                        selectedOrganization: server.envConfig.API_ADMINISTRATOR_ORGANIZATION_ID,
                    },
                },
            });
            assertToBeNonNullish(nonMemberSignUp.data?.signUp);
            const nonMemberToken = nonMemberSignUp.data.signUp.authenticationToken;

            // Create organization with the main test user
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

            // Try to query as non-member
            const result = await mercuriusClient.query(Query_postsByOrganization, {
                headers: { authorization: `bearer ${nonMemberToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                    },
                },
            });

            expect(result.data?.postsByOrganization).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "unauthorized_action_on_arguments_associated_resources",
                        }),
                        path: ["postsByOrganization"],
                    }),
                ]),
            );
        });
    });

    suite("Invalid Organization ID", () => {
        test("returns error when organization does not exist", async () => {
            const fakeOrgId = faker.string.uuid();

            const result = await mercuriusClient.query(Query_postsByOrganization, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: fakeOrgId,
                    },
                },
            });

            expect(result.data?.postsByOrganization).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "arguments_associated_resources_not_found",
                        }),
                        path: ["postsByOrganization"],
                    }),
                ]),
            );
        });
    });

    suite("Cursor-based Pagination", () => {
        test("forward pagination with first/after returns correct page and cursor", async () => {
            // Create organization
            const orgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Pagination Org ${faker.string.uuid()}`,
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

            // Create 5 posts
            const captions = ["Post 1", "Post 2", "Post 3", "Post 4", "Post 5"];
            for (const caption of captions) {
                await mercuriusClient.mutate(Mutation_createPost, {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            organizationId: orgId,
                            caption,
                            attachments: [],
                        },
                    },
                });
            }

            // Query first page with first: 2
            const firstPageResult = await mercuriusClient.query(
                Query_postsByOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            organizationId: orgId,
                            first: 2,
                        },
                    },
                },
            );

            expect(firstPageResult.errors).toBeUndefined();
            expect(firstPageResult.data?.postsByOrganization?.edges).toHaveLength(2);
            expect(firstPageResult.data?.postsByOrganization?.pageInfo.hasNextPage).toBe(true);
            expect(firstPageResult.data?.postsByOrganization?.pageInfo.hasPreviousPage).toBe(false);

            // Get cursor from first page
            const cursor = firstPageResult.data?.postsByOrganization?.pageInfo.endCursor;
            assertToBeNonNullish(cursor);

            // Query second page using after
            const secondPageResult = await mercuriusClient.query(
                Query_postsByOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            organizationId: orgId,
                            first: 2,
                            after: cursor,
                        },
                    },
                },
            );

            expect(secondPageResult.errors).toBeUndefined();
            expect(secondPageResult.data?.postsByOrganization?.edges).toHaveLength(2);
            expect(secondPageResult.data?.postsByOrganization?.pageInfo.hasNextPage).toBe(true);
            expect(secondPageResult.data?.postsByOrganization?.pageInfo.hasPreviousPage).toBe(true);

            // Verify posts are different
            const firstPageIds = firstPageResult.data?.postsByOrganization?.edges.map(
                (e: any) => e.node.id,
            );
            const secondPageIds = secondPageResult.data?.postsByOrganization?.edges.map(
                (e: any) => e.node.id,
            );
            expect(firstPageIds).not.toEqual(secondPageIds);
        });

        test("backward pagination with last/before returns correct page and order", async () => {
            // Create organization
            const orgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Backward Pagination Org ${faker.string.uuid()}`,
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

            // Create 5 posts
            const captions = ["Post 1", "Post 2", "Post 3", "Post 4", "Post 5"];
            for (const caption of captions) {
                await mercuriusClient.mutate(Mutation_createPost, {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            organizationId: orgId,
                            caption,
                            attachments: [],
                        },
                    },
                });
            }

            // Get all posts first to get a cursor from the middle
            const allPostsResult = await mercuriusClient.query(
                Query_postsByOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            organizationId: orgId,
                        },
                    },
                },
            });

            // Get cursor from the 4th post (index 3)
            const cursor = allPostsResult.data?.postsByOrganization?.edges[3]?.cursor;
            assertToBeNonNullish(cursor);

            // Query backward with last: 2, before: cursor
            const backwardResult = await mercuriusClient.query(
                Query_postsByOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            organizationId: orgId,
                            last: 2,
                            before: cursor,
                        },
                    },
                },
            );

            expect(backwardResult.errors).toBeUndefined();
            expect(backwardResult.data?.postsByOrganization?.edges).toHaveLength(2);
            expect(backwardResult.data?.postsByOrganization?.pageInfo.hasPreviousPage).toBe(true);
            expect(backwardResult.data?.postsByOrganization?.pageInfo.hasNextPage).toBe(true);

            // Verify correct posts are returned (should be posts at index 1 and 2)
            const returnedCaptions = backwardResult.data?.postsByOrganization?.edges.map(
                (e: any) => e.node.caption,
            );
            expect(returnedCaptions).toContain("Post 4");
            expect(returnedCaptions).toContain("Post 3");
        });

        test("returns error with invalid/malformed cursor", async () => {
            // Create organization
            const orgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Invalid Cursor Org ${faker.string.uuid()}`,
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

            // Create one post
            await mercuriusClient.mutate(Mutation_createPost, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        caption: "Test Post",
                        attachments: [],
                    },
                },
            });

            // Try with malformed cursor
            const result = await mercuriusClient.query(Query_postsByOrganization, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        first: 2,
                        after: "invalid-cursor-string",
                    },
                },
            });

            expect(result.data?.postsByOrganization).toBeNull();
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

        test("returns error with non-existent cursor", async () => {
            // Create organization
            const orgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Non-existent Cursor Org ${faker.string.uuid()}`,
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

            // Create a valid-looking but non-existent cursor
            const fakeCursor = Buffer.from(
                JSON.stringify({
                    createdAt: new Date().toISOString(),
                    id: faker.string.uuid(),
                }),
            ).toString("base64url");

            const result = await mercuriusClient.query(Query_postsByOrganization, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        first: 2,
                        after: fakeCursor,
                    },
                },
            });

            expect(result.data?.postsByOrganization).toBeNull();
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
    });
});