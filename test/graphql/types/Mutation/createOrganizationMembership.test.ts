import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { mercuriusClient } from "../client";
import { server } from "../../../server";
import { assertToBeNonNullish } from "../../../helpers";
import {
  Mutation_createOrganization,
  Mutation_createOrganizationMembership,
  Mutation_deleteCurrentUser,
  Query_signIn,
} from "../documentNodes";

/**
 * Helper: sign in as global administrator
 */
async function signInAsAdmin() {
  const result = await mercuriusClient.query(Query_signIn, {
    variables: {
      input: {
        emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
        password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
      },
    },
  });

  assertToBeNonNullish(result.data?.signIn);
  return result.data.signIn.authenticationToken;
}

suite("Mutation field createOrganizationMembership", () => {
  suite("authentication", () => {
    test("returns unauthenticated when client is not authenticated", async () => {
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

      expect(result.data?.createOrganizationMembership).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: { code: "unauthenticated" },
            path: ["createOrganizationMembership"],
          }),
        ]),
      );
    });
  });

  suite("argument validation", () => {
    test("returns invalid_arguments for invalid UUIDs", async () => {
      const adminToken = await signInAsAdmin();

      const result = await mercuriusClient.mutate(
        Mutation_createOrganizationMembership,
        {
          headers: { authorization: `bearer ${adminToken}` },
          variables: {
            input: {
              memberId: "not-a-uuid",
              organizationId: "also-not-a-uuid",
            },
          },
        },
      );

      expect(result.data?.createOrganizationMembership).toBeNull();
      expect(result.errors?.[0].extensions?.code).toBe("invalid_arguments");
    });
  });

  suite("current user existence", () => {
    test("returns unauthenticated if current user no longer exists", async () => {
      const { authToken } = await import(
        "../createRegularUserUsingAdmin"
      ).then((m) => m.createRegularUserUsingAdmin());

      assertToBeNonNullish(authToken);

      await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
        headers: { authorization: `bearer ${authToken}` },
      });

      const result = await mercuriusClient.mutate(
        Mutation_createOrganizationMembership,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              memberId: faker.string.uuid(),
              organizationId: faker.string.uuid(),
            },
          },
        },
      );

      expect(result.errors?.[0].extensions?.code).toBe("unauthenticated");
    });
  });

  suite("associated resource existence", () => {
    test("returns not_found when both member and organization are missing", async () => {
      const adminToken = await signInAsAdmin();

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

      expect(result.errors?.[0].extensions?.code).toBe(
        "arguments_associated_resources_not_found",
      );
    });

    test("returns not_found when member does not exist", async () => {
      const adminToken = await signInAsAdmin();

      const org = await mercuriusClient.mutate(Mutation_createOrganization, {
        headers: { authorization: `bearer ${adminToken}` },
        variables: {
          input: {
            name: faker.company.name(),
            description: "test",
            countryCode: "us",
            state: "CA",
            city: "LA",
            postalCode: "90001",
            addressLine1: "addr",
            addressLine2: "addr2",
          },
        },
      });

      const orgId = org.data?.createOrganization?.id;
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

      expect(result.errors?.[0].extensions?.code).toBe(
        "arguments_associated_resources_not_found",
      );
    });
  });

  suite("authorization rules", () => {
    test("prevents non-admin from creating membership for another user", async () => {
      const { authToken: regularToken, userId } = await import(
        "../createRegularUserUsingAdmin"
      ).then((m) => m.createRegularUserUsingAdmin());

      const adminToken = await signInAsAdmin();

      const org = await mercuriusClient.mutate(Mutation_createOrganization, {
        headers: { authorization: `bearer ${adminToken}` },
        variables: {
          input: {
            name: faker.company.name(),
            description: "test",
            countryCode: "us",
            state: "CA",
            city: "LA",
            postalCode: "90001",
            addressLine1: "addr",
            addressLine2: "addr2",
          },
        },
      });

      const orgId = org.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.mutate(
        Mutation_createOrganizationMembership,
        {
          headers: { authorization: `bearer ${regularToken}` },
          variables: {
            input: {
              memberId: faker.string.uuid(),
              organizationId: orgId,
            },
          },
        },
      );

      expect(result.errors?.[0].extensions?.code).toBe(
        "unauthorized_action_on_arguments_associated_resources",
      );
    });

    test("prevents non-admin from passing role argument", async () => {
      const { authToken, userId } = await import(
        "../createRegularUserUsingAdmin"
      ).then((m) => m.createRegularUserUsingAdmin());

      const adminToken = await signInAsAdmin();

      const org = await mercuriusClient.mutate(Mutation_createOrganization, {
        headers: { authorization: `bearer ${adminToken}` },
        variables: {
          input: {
            name: faker.company.name(),
            description: "test",
            countryCode: "us",
            state: "CA",
            city: "LA",
            postalCode: "90001",
            addressLine1: "addr",
            addressLine2: "addr2",
          },
        },
      });

      const orgId = org.data?.createOrganization?.id;
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

      expect(result.errors?.[0].extensions?.code).toBe(
        "unauthorized_arguments",
      );
    });
  });

  suite("edge cases", () => {
    test("returns unexpected when insert returns empty array", async () => {
      const adminToken = await signInAsAdmin();

      const org = await mercuriusClient.mutate(Mutation_createOrganization, {
        headers: { authorization: `bearer ${adminToken}` },
        variables: {
          input: {
            name: faker.company.name(),
            description: "test",
            countryCode: "us",
            state: "CA",
            city: "LA",
            postalCode: "90001",
            addressLine1: "addr",
            addressLine2: "addr2",
          },
        },
      });

      const orgId = org.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      const originalInsert = server.drizzleClient.insert;
      server.drizzleClient.insert = vi.fn().mockReturnValue({
        values: () => ({
          returning: async () => [],
        }),
      }) as any;

      try {
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

        expect(result.errors?.[0].extensions?.code).toBe("unexpected");
      } finally {
        server.drizzleClient.insert = originalInsert;
      }
    });
  });

  suite("success paths", () => {
    test("administrator successfully creates membership", async () => {
      const adminToken = await signInAsAdmin();

      const { userId: memberId } = await import(
        "../createRegularUserUsingAdmin"
      ).then((m) => m.createRegularUserUsingAdmin());

      const org = await mercuriusClient.mutate(Mutation_createOrganization, {
        headers: { authorization: `bearer ${adminToken}` },
        variables: {
          input: {
            name: faker.company.name(),
            description: "test",
            countryCode: "us",
            state: "CA",
            city: "LA",
            postalCode: "90001",
            addressLine1: "addr",
            addressLine2: "addr2",
          },
        },
      });

      const orgId = org.data?.createOrganization?.id;
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
      expect(result.data?.createOrganizationMembership?.id).toBe(orgId);
    });
  });
});
