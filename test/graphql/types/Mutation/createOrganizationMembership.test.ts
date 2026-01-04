import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
    Mutation_createOrganization,
    Mutation_createOrganizationMembership,
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
const adminToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(adminToken);

suite("Mutation field createOrganizationMembership", () => {
    suite("authentication", () => {
        test("rejects unauthenticated client", async () => {
            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    variables: {
                        input: {
                            memberId: faker.string.uuid(),
                            organizationId: faker.string.uuid(),
                        },
                    },
                },
            );

            expect(result.data?.createOrganizationMembership ?? null).toBeNull();
            expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
        });
    });

    suite("validation errors", () => {
        test("rejects invalid arguments", async () => {
            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId: "not-a-uuid",
                            organizationId: "not-a-uuid",
                        },
                    },
                },
            );

            expect(result.data?.createOrganizationMembership ?? null).toBeNull();
            expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
        });
    });

    suite("associated resources not found", () => {
        test("member and organization both missing", async () => {
            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId: faker.string.uuid(),
                            organizationId: faker.string.uuid(),
                        },
                    },
                },
            );

            expect(result.errors?.[0]?.extensions?.code).toBe(
                "arguments_associated_resources_not_found",
            );
        });

        test("member exists but organization missing", async () => {
            const { userId: memberId } =
                await import("../createRegularUserUsingAdmin").then((m) =>
                    m.createRegularUserUsingAdmin(),
                );

            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId,
                            organizationId: faker.string.uuid(),
                        },
                    },
                },
            );

            expect(result.errors?.[0]?.extensions?.code).toBe(
                "arguments_associated_resources_not_found",
            );
        });

        test("organization exists but member missing", async () => {
            const createOrg = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            name: "Org Exists Member Missing",
                            description: "symmetric test",
                            countryCode: "us",
                            state: "CA",
                            city: "SF",
                            postalCode: "94101",
                            addressLine1: "123 Symmetric",
                            addressLine2: "Suite X",
                        },
                    },
                },
            );

            const orgId = createOrg.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId: faker.string.uuid(),
                            organizationId: orgId,
                        },
                    },
                },
            );

            expect(result.data?.createOrganizationMembership ?? null).toBeNull();
            expect(result.errors?.[0]?.extensions?.code).toBe(
                "arguments_associated_resources_not_found",
            );
        });

    });

    suite("authorization", () => {
        test("non-admin cannot add other users", async () => {
            const { authToken } =
                await import("../createRegularUserUsingAdmin").then((m) =>
                    m.createRegularUserUsingAdmin(),
                );

            const createOrg = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            name: "Auth Org",
                            description: "auth test",
                            countryCode: "us",
                            state: "CA",
                            city: "SF",
                            postalCode: "94101",
                            addressLine1: "123 Test",
                            addressLine2: "Suite 1",
                        },
                    },
                },
            );

            const orgId = createOrg.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            memberId: faker.string.uuid(),
                            organizationId: orgId,
                        },
                    },
                },
            );

            expect(result.errors?.[0]?.extensions?.code).toBe(
                "unauthorized_action_on_arguments_associated_resources",
            );
        });

        test("non-admin cannot assign role", async () => {
            const { authToken, userId } =
                await import("../createRegularUserUsingAdmin").then((m) =>
                    m.createRegularUserUsingAdmin(),
                );

            const createOrg = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            name: "Role Org",
                            description: "role test",
                            countryCode: "us",
                            state: "CA",
                            city: "SF",
                            postalCode: "94101",
                            addressLine1: "456 Test",
                            addressLine2: "Suite 2",
                        },
                    },
                },
            );

            const orgId = createOrg.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: {
                        input: {
                            memberId: userId,
                            organizationId: orgId,
                            role: "administrator",
                        },
                    },
                },
            );

            expect(result.errors?.[0]?.extensions?.code).toBe(
                "unauthorized_arguments",
            );
        });
    });

    suite("success cases", () => {
        test("admin creates membership successfully", async () => {
            const { userId: memberId } =
                await import("../createRegularUserUsingAdmin").then((m) =>
                    m.createRegularUserUsingAdmin(),
                );

            const createOrg = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            name: "Success Org",
                            description: "success",
                            countryCode: "us",
                            state: "CA",
                            city: "SF",
                            postalCode: "94101",
                            addressLine1: "789 Test",
                            addressLine2: "Suite 3",
                        },
                    },
                },
            );

            const orgId = createOrg.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId,
                            organizationId: orgId,
                        },
                    },
                },
            );

            expect(result.errors).toBeUndefined();
            assertToBeNonNullish(result.data?.createOrganizationMembership);
            expect(result.data.createOrganizationMembership.id).not.toBe(orgId);
        });

        test("admin can create membership with role argument", async () => {
            const { userId: memberId } =
                await import("../createRegularUserUsingAdmin").then((m) =>
                    m.createRegularUserUsingAdmin(),
                );

            const createOrg = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            name: "Admin Role Org",
                            description: "admin role",
                            countryCode: "us",
                            state: "CA",
                            city: "SF",
                            postalCode: "94101",
                            addressLine1: "101 Test",
                            addressLine2: "Suite 4",
                        },
                    },
                },
            );

            const orgId = createOrg.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            const result = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId,
                            organizationId: orgId,
                            role: "administrator",
                        },
                    },
                },
            );
             
            expect(result.errors).toBeUndefined();
            assertToBeNonNullish(result.data?.createOrganizationMembership);
            const org = result.data?.createOrganizationMembership;
            expect(org?.id).toBe(orgId);
        });    
            
        test("prevents duplicate membership", async () => {
            const { userId: memberId } =
                await import("../createRegularUserUsingAdmin").then((m) =>
                    m.createRegularUserUsingAdmin(),
                );

            const createOrg = await mercuriusClient.mutate(
                Mutation_createOrganization,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            name: "Duplicate Org",
                            description: "duplicate",
                            countryCode: "us",
                            state: "CA",
                            city: "SF",
                            postalCode: "94101",
                            addressLine1: "111 Test",
                            addressLine2: "Suite 5",
                        },
                    },
                },
            );

            const orgId = createOrg.data?.createOrganization?.id;
            assertToBeNonNullish(orgId);

            await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId,
                            organizationId: orgId,
                        },
                    },
                },
            );

            const duplicate = await mercuriusClient.mutate(
                Mutation_createOrganizationMembership,
                {
                    headers: { authorization: `bearer ${adminToken}` },
                    variables: {
                        input: {
                            memberId,
                            organizationId: orgId,
                        },
                    },
                },
            );

            expect(duplicate.errors?.[0]?.extensions?.code).toBe(
                "forbidden_action_on_arguments_associated_resources",
            );
        });
    });
});
