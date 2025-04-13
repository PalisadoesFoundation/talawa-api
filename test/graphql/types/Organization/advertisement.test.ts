import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import {
    Mutation_createAdvertisement,
    Mutation_createOrganization,
    Query_advertisements,
    Query_signIn,
} from "../../../routes/graphql/documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";

const signInResult = await mercuriusClient.query(Query_signIn, {
    variables: {
        input: {
            emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
            password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
        },
    },
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Organization.blockedUsers Field", () => {
    suite("when the client is not authenticated", () => {
        test("should return an error with unauthenticated extensions code", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Advertisements Test Org ${faker.string.uuid()}`,
                            description: "Org to test advertisements",
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: "100 Test St",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.query(Query_advertisements, {
                variables: {
                    id: orgId,
                    first: 10,
                    after: null,
                    last: null,
                    before: null,
                    where: {
                        isCompleted: false
                    },
                },
            });

            expect(result.data?.organization?.advertisements?.edges).toBeUndefined();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({ code: "unauthenticated" }),
                        path: ["organization", "advertisements"],
                    }),
                ]),
            );
        });
    });

    suite("when there are no advertisements", () => {
        test("should return an empty active ads connection", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Advertisements Test Org ${faker.string.uuid()}`,
                            description: "Org to test advertisements",
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: "100 Test St",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            assertToBeNonNullish(signInResult.data?.signIn);
            assertToBeNonNullish(signInResult.data.signIn.user);
            const adminId = signInResult.data.signIn.user.id;
            assertToBeNonNullish(adminId);

            const resultOfActiveAds = await mercuriusClient.query(Query_advertisements, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    id: orgId,
                    first: 10,
                    after: null,
                    last: null,
                    before: null,
                    where: {
                        isCompleted: false
                    },
                },
            });

            const activeAdvertisements = resultOfActiveAds.data?.organization?.advertisements;
            assertToBeNonNullish(activeAdvertisements);

            expect(activeAdvertisements.edges).toHaveLength(0);
            expect(activeAdvertisements.pageInfo).toEqual({
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
            });
        });
        test("should return an empty complete ads connection", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Advertisements Test Org ${faker.string.uuid()}`,
                            description: "Org to test advertisements",
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: "100 Test St",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            assertToBeNonNullish(signInResult.data?.signIn);
            assertToBeNonNullish(signInResult.data.signIn.user);
            const adminId = signInResult.data.signIn.user.id;
            assertToBeNonNullish(adminId);

            const resultOfCompletedAds = await mercuriusClient.query(Query_advertisements, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    id: orgId,
                    first: 10,
                    after: null,
                    last: null,
                    before: null,
                    where: {
                        isCompleted: false
                    },
                },
            });

            const completedAdvertisements = resultOfCompletedAds.data?.organization?.advertisements;
            assertToBeNonNullish(completedAdvertisements);

            expect(completedAdvertisements.edges).toHaveLength(0);
            expect(completedAdvertisements.pageInfo).toEqual({
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
            });
        });
    });

    suite("when there are advertisements", () => {
        test("should return the active ads in the connection", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Advertisements Test Org ${faker.string.uuid()}`,
                            description: "Org to test advertisements",
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: "100 Test St",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            assertToBeNonNullish(signInResult.data?.signIn);
            assertToBeNonNullish(signInResult.data.signIn.user);
            const adminId = signInResult.data.signIn.user.id;
            assertToBeNonNullish(adminId);

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session",
                        type: "banner",
                        startAt: new Date('2025-02-02').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            const resultOfActiveAds = await mercuriusClient.query(Query_advertisements, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    id: orgId,
                    first: 10,
                    after: null,
                    last: null,
                    before: null,
                    where: {
                        isCompleted: false
                    },
                },
            });

            const activeAdvertisements = resultOfActiveAds.data?.organization?.advertisements;
            console.log("Active advertisements are: ", activeAdvertisements)
            assertToBeNonNullish(activeAdvertisements);

            expect(activeAdvertisements.edges).toHaveLength(1);
            expect(activeAdvertisements.pageInfo.hasNextPage).toEqual(false);
            expect(activeAdvertisements.pageInfo.hasPreviousPage).toEqual(false);
            expect(activeAdvertisements.pageInfo.startCursor).not.toEqual(null);
            expect(activeAdvertisements.pageInfo.endCursor).not.toEqual(null);
        });
        test("should return the completed ads in the connection", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Advertisements Test Org ${faker.string.uuid()}`,
                            description: "Org to test advertisements",
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: "100 Test St",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            assertToBeNonNullish(signInResult.data?.signIn);
            assertToBeNonNullish(signInResult.data.signIn.user);
            const adminId = signInResult.data.signIn.user.id;
            assertToBeNonNullish(adminId);

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            const resultOfCompletedAds = await mercuriusClient.query(Query_advertisements, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    id: orgId,
                    first: 10,
                    after: null,
                    last: null,
                    before: null,
                    where: {
                        isCompleted: true
                    },
                },
            });

            const completedAdvertisements = resultOfCompletedAds.data?.organization?.advertisements;
            assertToBeNonNullish(completedAdvertisements);

            expect(completedAdvertisements.edges).toHaveLength(1);
            expect(completedAdvertisements.pageInfo.hasNextPage).toEqual(false);
            expect(completedAdvertisements.pageInfo.hasPreviousPage).toEqual(false);
            expect(completedAdvertisements.pageInfo.startCursor).not.toEqual(null);
            expect(completedAdvertisements.pageInfo.endCursor).not.toEqual(null);
        });
    });

    suite("when pagination is used", () => {
        test("should respect the 'first' parameter in active ads", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Advertisements Test Org ${faker.string.uuid()}`,
                            description: "Org to test advertisements",
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: "100 Test St",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            assertToBeNonNullish(signInResult.data?.signIn);
            assertToBeNonNullish(signInResult.data.signIn.user);
            const adminId = signInResult.data.signIn.user.id;
            assertToBeNonNullish(adminId);

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 2",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 3",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 4",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 5",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 6",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 7",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 8",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 9",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2030-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            const resultOfAllActiveAds = await mercuriusClient.query(Query_advertisements, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    id: orgId,
                    first: 6,
                    after: null,
                    last: null,
                    before: null,
                    where: {
                        isCompleted: false
                    },
                },
            });
            assertToBeNonNullish(resultOfAllActiveAds);

            const activeAdvertisements = resultOfAllActiveAds.data?.organization?.advertisements;
            assertToBeNonNullish(activeAdvertisements);
            expect(activeAdvertisements.edges).toHaveLength(6);
            expect(activeAdvertisements.pageInfo.hasNextPage).toBe(true);
        });
        test("should respect the 'first' parameter in completed ads", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Advertisements Test Org ${faker.string.uuid()}`,
                            description: "Org to test advertisements",
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: "100 Test St",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            assertToBeNonNullish(signInResult.data?.signIn);
            assertToBeNonNullish(signInResult.data.signIn.user);
            const adminId = signInResult.data.signIn.user.id;
            assertToBeNonNullish(adminId);

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 2",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 3",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 4",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 5",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 6",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 7",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 8",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        organizationId: orgId,
                        name: "Linux session 9",
                        type: "banner",
                        startAt: new Date('2025-01-01').toISOString(),
                        endAt: new Date('2025-02-02').toISOString(),
                        description: 'learn about basics',
                        attachments: undefined
                    },
                },
            });

            const resultOfAllCompletedAds = await mercuriusClient.query(Query_advertisements, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    id: orgId,
                    first: 6,
                    after: null,
                    last: null,
                    before: null,
                    where: {
                        isCompleted: true
                    },
                },
            });
            assertToBeNonNullish(resultOfAllCompletedAds);

            const completedAdvertisements = resultOfAllCompletedAds.data?.organization?.advertisements;
            assertToBeNonNullish(completedAdvertisements);
            expect(completedAdvertisements.edges).toHaveLength(6);
            expect(completedAdvertisements.pageInfo.hasNextPage).toBe(true);
        });
    })
});
