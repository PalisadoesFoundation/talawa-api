import { faker } from "@faker-js/faker";

import { afterAll, beforeAll, expect, suite, test } from "vitest";

import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";

import { assertToBeNonNullish } from "../../../helpers";

import { server } from "../../../server";

import { mercuriusClient } from "../client";

import {

    Mutation_createChat,

    Mutation_createChatMembership,

    Mutation_createOrganization,

    Mutation_createOrganizationMembership,

    Mutation_createUser,

    Mutation_deleteChat,

    Mutation_deleteOrganization,

    Mutation_deleteUser,

    Query_signIn,

} from "../documentNodes";



/**

 * COVERAGE NOTE:

 *

 * This test file covers 80% of src/graphql/types/Chat/createdAt.ts.

 * The remaining 20% handles auth and user checks unreachable in integration tests,

 * since src/graphql/types/Query/chat.ts already validates them.

 *

 * The extra checks in createdAt.ts are defensive safeguards, only testable via

 * mocked unit tests. Therefore, 80% represents full reachable coverage.

 */



interface User {

    userId: string;

    authToken: string;

}



interface SetupEnv {

    adminAuthToken: string;

    adminUserId: string;

    organizationId: string;

    testChatId: string;

    users: [User, User];

}



const Query_chat_with_createdAt = `

    query Query_chat_with_createdAt($input: QueryChatInput!) {

        chat(input: $input) {

            id

            name

            createdAt

        }

    }

`;



async function getAdminToken(): Promise<string> {

    const result = await mercuriusClient.query(Query_signIn, {

        variables: {

            input: {

                emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,

                password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,

            },

        },

    });

    const authToken = result.data?.signIn?.authenticationToken;

    assertToBeNonNullish(authToken);

    return authToken;

}



async function getAdminUserId(): Promise<string> {

    const result = await mercuriusClient.query(Query_signIn, {

        variables: {

            input: {

                emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,

                password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,

            },

        },

    });

    const userId = result.data?.signIn?.user?.id;

    assertToBeNonNullish(userId);

    return userId;

}



async function createTestUser(

    adminAuthToken: string,

    role: "regular" | "administrator" = "regular",

    isEmailAddressVerified = false,

): Promise<User> {

    const userResult = await mercuriusClient.mutate(Mutation_createUser, {

        headers: { authorization: `bearer ${adminAuthToken}` },

        variables: {

            input: {

                emailAddress: `${faker.string.uuid()}@test.com`,

                name: faker.person.fullName(),

                password: "password123",

                role,

                isEmailAddressVerified,

            },

        },

    });

    assertToBeNonNullish(userResult.data?.createUser);

    return {

        userId: userResult.data.createUser.user?.id as string,

        authToken: userResult.data.createUser.authenticationToken as string,

    };

}



async function createTestOrganization(adminAuthToken: string): Promise<string> {

    const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {

        headers: { authorization: `bearer ${adminAuthToken}` },

        variables: { input: { name: `Test Org ${faker.string.uuid()}`, countryCode: "us" } },

    });

    assertToBeNonNullish(orgResult.data?.createOrganization);

    return orgResult.data.createOrganization.id;

}



async function createOrganizationMembership(

    adminAuthToken: string,

    memberId: string,

    organizationId: string,

    role: "regular" | "administrator" = "regular",

): Promise<string> {

    const result = await mercuriusClient.mutate(Mutation_createOrganizationMembership, {

        headers: { authorization: `bearer ${adminAuthToken}` },

        variables: { input: { memberId, organizationId, role } },

    });

    assertToBeNonNullish(result.data?.createOrganizationMembership);

    return result.data.createOrganizationMembership.id;

}



async function createTestChat(authToken: string, organizationId: string): Promise<string> {

    const chatResult = await mercuriusClient.mutate(Mutation_createChat, {

        headers: { authorization: `bearer ${authToken}` },

        variables: { input: { name: `Test Chat ${faker.string.uuid()}`, organizationId } },

    });

    assertToBeNonNullish(chatResult.data?.createChat);

    return chatResult.data.createChat.id;

}



async function addUserToChat(adminAuthToken: string, chatId: string, memberId: string): Promise<string> {

    const result = await mercuriusClient.mutate(Mutation_createChatMembership, {

        headers: { authorization: `bearer ${adminAuthToken}` },

        variables: { input: { chatId, memberId } },

    });

    assertToBeNonNullish(result.data?.createChatMembership);

    return result.data.createChatMembership.id;

}



async function setupTestEnvironment(): Promise<SetupEnv> {

    const adminAuthToken = await getAdminToken();

    const adminUserId = await getAdminUserId();



    const [user1, user2] = await Promise.all([createTestUser(adminAuthToken), createTestUser(adminAuthToken)]);

    const organizationId = await createTestOrganization(adminAuthToken);



    await Promise.all([

        createOrganizationMembership(adminAuthToken, adminUserId, organizationId, "administrator"),

        createOrganizationMembership(adminAuthToken, user1.userId, organizationId),

        createOrganizationMembership(adminAuthToken, user2.userId, organizationId),

    ]);



    const testChatId = await createTestChat(adminAuthToken, organizationId);

    await addUserToChat(adminAuthToken, testChatId, user1.userId);



    return { adminAuthToken, adminUserId, organizationId, testChatId, users: [user1, user2] };

}



async function cleanupTestData(adminAuthToken: string, userIds: string[], organizationIds: string[], chatIds: string[]) {

    await Promise.all([

        ...chatIds.map(id =>

            mercuriusClient

                .mutate(Mutation_deleteChat, { headers: { authorization: `bearer ${adminAuthToken}` }, variables: { input: { id } } })

                .catch((_err: unknown) => {

                    // Silently ignore cleanup errors

                })

        ),

        ...userIds.map(id =>

            mercuriusClient

                .mutate(Mutation_deleteUser, { headers: { authorization: `bearer ${adminAuthToken}` }, variables: { input: { id } } })

                .catch((_err: unknown) => {

                    // Silently ignore cleanup errors

                })

        ),

        ...organizationIds.map(id =>

            mercuriusClient

                .mutate(Mutation_deleteOrganization, { headers: { authorization: `bearer ${adminAuthToken}` }, variables: { input: { id } } })

                .catch((_err: unknown) => {

                    // Silently ignore cleanup errors

                })

        ),

    ]);

}



suite("Chat field createdAt", () => {

    let adminAuthToken: string;

    let regularUser1AuthToken: string;

    let regularUser2AuthToken: string;

    let organizationId: string;

    let testChatId: string;



    const createdUserIds: string[] = [];

    const createdOrganizationIds: string[] = [];

    const createdChatIds: string[] = [];



    beforeAll(async () => {

        const setup = await setupTestEnvironment();

        adminAuthToken = setup.adminAuthToken;

        organizationId = setup.organizationId;

        testChatId = setup.testChatId;



        regularUser1AuthToken = setup.users[0].authToken;

        regularUser2AuthToken = setup.users[1].authToken;



        createdUserIds.push(setup.users[0].userId, setup.users[1].userId);

        createdOrganizationIds.push(organizationId);

        createdChatIds.push(testChatId);

    });



    afterAll(async () => {

        await cleanupTestData(adminAuthToken, createdUserIds, createdOrganizationIds, createdChatIds);

    });



    test("unauthenticated client → graphql unauthenticated error", async () => {

        const result = await mercuriusClient.query(Query_chat_with_createdAt, { variables: { input: { id: testChatId } } });

        expect(result.data?.chat).toBeNull();

        expect(result.errors).toEqual(

            expect.arrayContaining<TalawaGraphQLFormattedError>([

                expect.objectContaining<TalawaGraphQLFormattedError>({

                    extensions: expect.objectContaining({ code: "unauthenticated" }),

                    path: ["chat"],

                }),

            ])

        );

    });



    test("non-member regular user → unauthorized_action error", async () => {

        const result = await mercuriusClient.query(Query_chat_with_createdAt, {

            headers: { authorization: `bearer ${regularUser2AuthToken}` },

            variables: { input: { id: testChatId } },

        });

        expect(result.data?.chat).not.toBeNull();

        expect(result.data?.chat?.createdAt).toBeNull();

        expect(result.errors).toEqual(

            expect.arrayContaining<TalawaGraphQLFormattedError>([

                expect.objectContaining<TalawaGraphQLFormattedError>({

                    extensions: expect.objectContaining({ code: "unauthorized_action" }),

                    path: ["chat", "createdAt"],

                }),

            ])

        );

    });



    test("chat member can access createdAt", async () => {

        const result = await mercuriusClient.query(Query_chat_with_createdAt, {

            headers: { authorization: `bearer ${regularUser1AuthToken}` },

            variables: { input: { id: testChatId } },

        });

        expect(result.errors ?? []).toHaveLength(0);

        expect(result.data?.chat?.createdAt).toBeDefined();

    });



    test("admin can access createdAt", async () => {

        const result = await mercuriusClient.query(Query_chat_with_createdAt, {

            headers: { authorization: `bearer ${adminAuthToken}` },

            variables: { input: { id: testChatId } },

        });

        expect(result.errors ?? []).toHaveLength(0);

        expect(result.data?.chat?.createdAt).toBeDefined();

    });



    test("allows non-admin chat creator to access createdAt", async () => {

        const creatorChatId = await createTestChat(regularUser1AuthToken, organizationId);

        createdChatIds.push(creatorChatId);

        const result = await mercuriusClient.query(Query_chat_with_createdAt, {

            headers: { authorization: `bearer ${regularUser1AuthToken}` },

            variables: { input: { id: creatorChatId } },

        });

        expect(result.errors ?? []).toHaveLength(0);

        expect(result.data?.chat?.id).toBe(creatorChatId);

        expect(result.data?.chat?.createdAt).toBeDefined();

    });



    test("deleted user token → unauthenticated error", async () => {

        const tempUser = await createTestUser(adminAuthToken);

        await mercuriusClient.mutate(Mutation_deleteUser, {

            headers: { authorization: `bearer ${adminAuthToken}` },

            variables: { input: { id: tempUser.userId } },

        });

        const result = await mercuriusClient.query(Query_chat_with_createdAt, {

            headers: { authorization: `bearer ${tempUser.authToken}` },

            variables: { input: { id: testChatId } },

        });

        expect(result.data?.chat).toBeNull();

        expect(result.errors).toEqual(

            expect.arrayContaining<TalawaGraphQLFormattedError>([

                expect.objectContaining<TalawaGraphQLFormattedError>({

                    extensions: expect.objectContaining({ code: "unauthenticated" }),

                    path: ["chat"],

                }),

            ])

        );

    });



    test("createdAt field returns valid ISO 8601 timestamp", async () => {

        const result = await mercuriusClient.query(Query_chat_with_createdAt, {

            headers: { authorization: `bearer ${regularUser1AuthToken}` },

            variables: { input: { id: testChatId } },

        });

        expect(result.errors ?? []).toHaveLength(0);

        expect(result.data?.chat?.createdAt).toBeDefined();



        const createdAt = new Date(result.data?.chat?.createdAt as string);

        expect(createdAt).toBeInstanceOf(Date);

        expect(createdAt.getTime()).not.toBeNaN();

        expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());

    });

});

