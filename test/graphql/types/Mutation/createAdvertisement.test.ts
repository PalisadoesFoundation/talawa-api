import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
    Mutation_createAdvertisement,
    Mutation_createOrganization,
    Mutation_deleteCurrentUser,
    Mutation_joinPublicOrganization,
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
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field createAdvertisement", () => {
    suite("when the client is not authenticated", () => {
        test("should return an error with unauthenticated extensions code", async () => {
            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                variables: {
                    input: {
                        name: "Test Advertisement",
                        description: "Test Description",
                        organizationId: faker.string.uuid(),
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });
            expect(result.data?.createAdvertisement).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({ code: "unauthenticated" }),
                        path: ["createAdvertisement"],
                    }),
                ]),
            );
        });
    });

    suite("when arguments are invalid", () => {
        test("should return an error with invalid_arguments extension code for invalid organizationId", async () => {
            const invalidOrganizationId = "not-a-valid-uuid";
            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: "Test Ad",
                        description: "Test Description",
                        organizationId: invalidOrganizationId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });

            expect(result.data?.createAdvertisement).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "invalid_arguments",
                            issues: expect.arrayContaining([
                                expect.objectContaining({
                                    argumentPath: ["input", "organizationId"],
                                }),
                            ]),
                        }),
                        path: ["createAdvertisement"],
                    }),
                ]),
            );
        });

        test("should return an error with invalid_arguments for invalid attachment mime type", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            // Create a mock file upload with invalid mime type
            const invalidMimeTypeFile = Promise.resolve({
                filename: "test.txt",
                mimetype: "text/plain",
                encoding: "7bit",
                createReadStream: () => null,
            });

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: "Ad with Invalid Mime",
                        description: "Test Description",
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                        attachments: [invalidMimeTypeFile],
                    },
                },
            });

            expect(result.data?.createAdvertisement).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "invalid_arguments",
                            issues: expect.arrayContaining([
                                expect.objectContaining({
                                    argumentPath: ["input", "attachments", 0],
                                }),
                            ]),
                        }),
                        path: ["createAdvertisement"],
                    }),
                ]),
            );
        });
    });

    suite("when the current user does not exist", () => {
        test("should return an error with unauthenticated extensions code", async () => {
            const { authToken: userToken } = await import(
                "../createRegularUserUsingAdmin"
            ).then((module) => module.createRegularUserUsingAdmin());
            assertToBeNonNullish(userToken);
            
            await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
                headers: { authorization: `bearer ${userToken}` },
            });

            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${userToken}` },
                variables: {
                    input: {
                        name: "Test Ad",
                        description: "Test Description",
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });

            expect(result.data?.createAdvertisement).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({ code: "unauthenticated" }),
                        path: ["createAdvertisement"],
                    }),
                ]),
            );
        });
    });

    suite("when the specified organization does not exist", () => {
        test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: "Test Ad",
                        description: "Test Description",
                        organizationId: faker.string.uuid(),
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });

            expect(result.data?.createAdvertisement).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "arguments_associated_resources_not_found",
                            issues: expect.arrayContaining([
                                expect.objectContaining({
                                    argumentPath: ["input", "organizationId"],
                                }),
                            ]),
                        }),
                        path: ["createAdvertisement"],
                    }),
                ]),
            );
        });
    });

    suite("when an advertisement with the same name already exists", () => {
        test("should return an error with forbidden_action_on_arguments_associated_resources extensions code", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const adName = `Duplicate Ad ${faker.string.uuid()}`;

            // Create first advertisement
            const firstResult = await mercuriusClient.mutate(
                Mutation_createAdvertisement,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: adName,
                            description: "First Ad",
                            organizationId: orgId,
                            type: "banner",
                            startAt: new Date().toISOString(),
                            endAt: new Date(Date.now() + 86400000).toISOString(),
                        },
                    },
                },
            );
            expect(firstResult.errors).toBeUndefined();
            assertToBeNonNullish(firstResult.data?.createAdvertisement);

            // Try to create second advertisement with same name
            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: adName,
                        description: "Duplicate Ad",
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });

            expect(result.data?.createAdvertisement).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "forbidden_action_on_arguments_associated_resources",
                            issues: expect.arrayContaining([
                                expect.objectContaining({
                                    argumentPath: ["input", "name"],
                                    message: "This name is not available.",
                                }),
                            ]),
                        }),
                        path: ["createAdvertisement"],
                    }),
                ]),
            );
        });
    });

    suite("when the client is not authorized", () => {
        test("should return an error with unauthorized_action_on_arguments_associated_resources when user is not admin and not org admin", async () => {
            const { authToken: regularAuthToken } = await import(
                "../createRegularUserUsingAdmin"
            ).then((module) => module.createRegularUserUsingAdmin());
            assertToBeNonNullish(regularAuthToken);

            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            // Join as regular member
            const joinResult = await mercuriusClient.mutate(
                Mutation_joinPublicOrganization,
                {
                    headers: { authorization: `bearer ${regularAuthToken}` },
                    variables: {
                        input: {
                            organizationId: orgId,
                        },
                    },
                },
            );
            expect(joinResult.data?.joinPublicOrganization).toBeDefined();

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${regularAuthToken}` },
                variables: {
                    input: {
                        name: "Unauthorized Ad",
                        description: "Test Description",
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });

            expect(result.data?.createAdvertisement).toBeNull();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({
                            code: "unauthorized_action_on_arguments_associated_resources",
                            issues: expect.arrayContaining([
                                expect.objectContaining({
                                    argumentPath: ["input", "organizationId"],
                                }),
                            ]),
                        }),
                        path: ["createAdvertisement"],
                    }),
                ]),
            );
        });

        test("should allow organization administrator to create advertisement", async () => {
            const { authToken: orgAdminToken } = await import(
                "../createRegularUserUsingAdmin"
            ).then((module) => module.createRegularUserUsingAdmin());
            assertToBeNonNullish(orgAdminToken);

            // Create organization with org admin
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${orgAdminToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${orgAdminToken}` },
                variables: {
                    input: {
                        name: `Org Admin Ad ${faker.string.uuid()}`,
                        description: "Created by org admin",
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    description: "Created by org admin",
                    type: "banner",
                }),
            );
        });
    });

    suite("when the database insert operation unexpectedly fails", () => {
        test("should return an error with unexpected extensions code", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            // Mock the transaction to simulate the error
            const originalTransaction = server.drizzleClient.transaction;
            server.drizzleClient.transaction = vi
                .fn()
                .mockImplementation(async (callback) => {
                    const mockTx = {
                        insert: () => ({
                            values: () => ({
                                returning: async () => [],
                            }),
                        }),
                    };
                    return await callback(mockTx);
                });

            try {
                const result = await mercuriusClient.mutate(
                    Mutation_createAdvertisement,
                    {
                        headers: { authorization: `bearer ${authToken}` },
                        variables: {
                            input: {
                                name: `Failed Ad ${faker.string.uuid()}`,
                                description: "Should fail",
                                organizationId: orgId,
                                type: "banner",
                                startAt: new Date().toISOString(),
                                endAt: new Date(Date.now() + 86400000).toISOString(),
                            },
                        },
                    },
                );

                expect(result.data?.createAdvertisement).toBeNull();
                expect(result.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            extensions: expect.objectContaining({
                                code: "unexpected",
                            }),
                            path: ["createAdvertisement"],
                        }),
                    ]),
                );
            } finally {
                server.drizzleClient.transaction = originalTransaction;
            }
        });
    });

    suite("when creating advertisement successfully", () => {
        test("should create advertisement without attachments", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const startDate = new Date();
            const endDate = new Date(Date.now() + 86400000 * 7); // 7 days later

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: `Ad No Attachments ${faker.string.uuid()}`,
                        description: "Advertisement without attachments",
                        organizationId: orgId,
                        type: "pop_up",
                        startAt: startDate.toISOString(),
                        endAt: endDate.toISOString(),
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    name: expect.stringContaining("Ad No Attachments"),
                    description: "Advertisement without attachments",
                    type: "pop_up",
                    attachments: [],
                    organization: expect.objectContaining({
                        id: orgId,
                    }),
                }),
            );
        });

        test("should create advertisement with single attachment", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const mockAttachment = Promise.resolve({
                filename: "banner.png",
                mimetype: "image/png",
                encoding: "7bit",
                createReadStream: () => {
                    const { Readable } = require("stream");
                    return Readable.from(Buffer.from("fake image data"));
                },
            });

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: `Ad With Attachment ${faker.string.uuid()}`,
                        description: "Advertisement with one attachment",
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                        attachments: [mockAttachment],
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            const advertisement = result.data?.createAdvertisement;
            assertToBeNonNullish(advertisement);
            expect(advertisement).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    description: "Advertisement with one attachment",
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            mimeType: "image/png",
                            name: expect.any(String),
                        }),
                    ]),
                }),
            );
            expect(advertisement.attachments ?? []).toHaveLength(1);
        });

        test("should create advertisement with multiple attachments", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const { Readable } = require("stream");
            const mockAttachment1 = Promise.resolve({
                filename: "image1.png",
                mimetype: "image/png",
                encoding: "7bit",
                createReadStream: () => Readable.from(Buffer.from("image 1")),
            });

            const mockAttachment2 = Promise.resolve({
                filename: "image2.jpg",
                mimetype: "image/jpeg",
                encoding: "7bit",
                createReadStream: () => Readable.from(Buffer.from("image 2")),
            });

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: `Ad Multiple Attachments ${faker.string.uuid()}`,
                        description: "Advertisement with multiple attachments",
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                        attachments: [mockAttachment1, mockAttachment2],
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            const advertisement = result.data?.createAdvertisement;
            assertToBeNonNullish(advertisement);
            expect(advertisement).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    description: "Advertisement with multiple attachments",
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            mimeType: "image/png",
                        }),
                        expect.objectContaining({
                            mimeType: "image/jpeg",
                        }),
                    ]),
                }),
            );
            expect(advertisement.attachments ?? []).toHaveLength(2);
        });

        test("should create advertisement with valid video attachment", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const { Readable } = require("stream");
            const mockVideoAttachment = Promise.resolve({
                filename: "promo.mp4",
                mimetype: "video/mp4",
                encoding: "7bit",
                createReadStream: () => Readable.from(Buffer.from("video data")),
            });

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: `Ad Video ${faker.string.uuid()}`,
                        description: "Advertisement with video",
                        organizationId: orgId,
                        type: "menu",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                        attachments: [mockVideoAttachment],
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    type: "menu",
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            mimeType: "video/mp4",
                        }),
                    ]),
                }),
            );
        });
    });

    suite("edge cases and validation", () => {
        test("should handle advertisement with all supported attachment mime types", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const { Readable } = require("stream");
            
            // Test PNG
            const pngAttachment = Promise.resolve({
                filename: "file.png",
                mimetype: "image/png",
                encoding: "7bit",
                createReadStream: () => Readable.from(Buffer.from("data")),
            });

            const pngResult = await mercuriusClient.mutate(
                Mutation_createAdvertisement,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Ad PNG ${faker.string.uuid()}`,
                            description: "Testing image/png",
                            organizationId: orgId,
                            type: "banner",
                            startAt: new Date().toISOString(),
                            endAt: new Date(Date.now() + 86400000).toISOString(),
                            attachments: [pngAttachment],
                        },
                    },
                },
            );

            expect(pngResult.errors).toBeUndefined();
            expect(pngResult.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            mimeType: "image/png",
                        }),
                    ]),
                }),
            );

            // Test JPEG
            const jpegAttachment = Promise.resolve({
                filename: "file.jpeg",
                mimetype: "image/jpeg",
                encoding: "7bit",
                createReadStream: () => Readable.from(Buffer.from("data")),
            });

            const jpegResult = await mercuriusClient.mutate(
                Mutation_createAdvertisement,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Ad JPEG ${faker.string.uuid()}`,
                            description: "Testing image/jpeg",
                            organizationId: orgId,
                            type: "banner",
                            startAt: new Date().toISOString(),
                            endAt: new Date(Date.now() + 86400000).toISOString(),
                            attachments: [jpegAttachment],
                        },
                    },
                },
            );

            expect(jpegResult.errors).toBeUndefined();
            expect(jpegResult.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            mimeType: "image/jpeg",
                        }),
                    ]),
                }),
            );

            // Test WebP
            const webpAttachment = Promise.resolve({
                filename: "file.webp",
                mimetype: "image/webp",
                encoding: "7bit",
                createReadStream: () => Readable.from(Buffer.from("data")),
            });

            const webpResult = await mercuriusClient.mutate(
                Mutation_createAdvertisement,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Ad WebP ${faker.string.uuid()}`,
                            description: "Testing image/webp",
                            organizationId: orgId,
                            type: "banner",
                            startAt: new Date().toISOString(),
                            endAt: new Date(Date.now() + 86400000).toISOString(),
                            attachments: [webpAttachment],
                        },
                    },
                },
            );

            expect(webpResult.errors).toBeUndefined();
            expect(webpResult.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            mimeType: "image/webp",
                        }),
                    ]),
                }),
            );

            // Test MP4
            const mp4Attachment = Promise.resolve({
                filename: "file.mp4",
                mimetype: "video/mp4",
                encoding: "7bit",
                createReadStream: () => Readable.from(Buffer.from("data")),
            });

            const mp4Result = await mercuriusClient.mutate(
                Mutation_createAdvertisement,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: `Ad MP4 ${faker.string.uuid()}`,
                            description: "Testing video/mp4",
                            organizationId: orgId,
                            type: "banner",
                            startAt: new Date().toISOString(),
                            endAt: new Date(Date.now() + 86400000).toISOString(),
                            attachments: [mp4Attachment],
                        },
                    },
                },
            );

            expect(mp4Result.errors).toBeUndefined();
            expect(mp4Result.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    attachments: expect.arrayContaining([
                        expect.objectContaining({
                            mimeType: "video/mp4",
                        }),
                    ]),
                }),
            );
        });



        test("should handle long description text", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const longDescription = faker.lorem.paragraphs(5);

            const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
                headers: { authorization: `bearer ${authToken}` },
                variables: {
                    input: {
                        name: `Ad Long Desc ${faker.string.uuid()}`,
                        description: longDescription,
                        organizationId: orgId,
                        type: "banner",
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 86400000).toISOString(),
                    },
                },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.createAdvertisement).toEqual(
                expect.objectContaining({
                    description: longDescription,
                }),
            );
        });

        test("should handle different advertisement types", async () => {
            const createOrgResult = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            name: faker.company.name(),
                            description: faker.lorem.sentence(),
                            countryCode: "us",
                            state: "CA",
                            city: "San Francisco",
                            postalCode: "94101",
                            addressLine1: faker.location.streetAddress(),
                        },
                    },
                },
            );
            const orgId = createOrgResult.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const adTypes: ("banner" | "menu" | "pop_up")[] = ["banner", "menu", "pop_up"];

            for (const adType of adTypes) {
                const result = await mercuriusClient.mutate(
                    Mutation_createAdvertisement,
                    {
                        headers: { authorization: `bearer ${authToken}` },
                        variables: {
                            input: {
                                name: `Ad Type ${adType} ${faker.string.uuid()}`,
                                description: `Testing type ${adType}`,
                                organizationId: orgId,
                                type: adType,
                                startAt: new Date().toISOString(),
                                endAt: new Date(Date.now() + 86400000).toISOString(),
                            },
                        },
                    },
                );

                expect(result.errors).toBeUndefined();
                expect(result.data?.createAdvertisement).toEqual(
                    expect.objectContaining({
                        type: adType,
                    }),
                );
            }
        });
    });
});
