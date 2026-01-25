import { faker } from "@faker-js/faker";
import { beforeAll, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
  Mutation_createOrganization,
  Mutation_createTagFolder,
  Mutation_deleteCurrentUser,
  Mutation_joinPublicOrganization,
  Query_signIn,
} from "../documentNodes";

let orgId: string | undefined;
let authToken: string;

beforeAll(async () => {
  // Sign in once
  const signInResult = await mercuriusClient.query(Query_signIn, {
    variables: {
      input: {
        emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
        password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
      },
    },
  });

  assertToBeNonNullish(signInResult.data);
  assertToBeNonNullish(signInResult.data.signIn);
  const token = signInResult.data.signIn.authenticationToken;
  assertToBeNonNullish(token);
  authToken = token;
});

const OrganizationTagFoldersQuery = `
  query OrganizationTagFolders(
    $input: QueryOrganizationInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    organization(input: $input) {
      id
      tagFolders(first: $first, after: $after, last: $last, before: $before) {
        edges {
          cursor
          node {
            id
            name
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  }
`;

suite("Organization field tagFolders", () => {
  suite("when the client is not authenticated", () => {
    test("should return an error with unauthenticated extensions code", async () => {
      const createOrg = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `${faker.company.name()} ${faker.string.ulid()}`,
              description: "Unauth tagFolders test",
              countryCode: "us",
              state: "CA",
              city: "SF",
              postalCode: "94101",
              addressLine1: "123 Test St",
            },
          },
        },
      );

      const orgId = createOrg.data?.createOrganization?.id;
      expect(orgId).toBeDefined();

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        variables: {
          input: { id: orgId },
          first: 2,
        },
      });

      expect(result.data?.organization?.tagFolders ?? null).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({ code: "unauthenticated" }),
            path: ["organization", "tagFolders"],
          }),
        ]),
      );
    });
  });

  suite("when arguments are invalid (cursor parse error)", () => {
    test("should return an error with invalid_arguments extensions code", async () => {
      const createOrg = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `${faker.company.name()} ${faker.string.ulid()}`,
              description: "TagFolders invalid cursor test",
              countryCode: "us",
              state: "CA",
              city: "SF",
              postalCode: "94101",
              addressLine1: "123 Test St",
            },
          },
        },
      );

      const orgId = createOrg.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { id: orgId },
          first: 2,
          after: "not-a-valid-base64",
        },
      });

      expect(result.data?.organization?.tagFolders ?? null).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "invalid_arguments",
              issues: expect.arrayContaining([
                expect.objectContaining({
                  argumentPath: ["after"],
                }),
              ]),
            }),
            path: ["organization", "tagFolders"],
          }),
        ]),
      );
    });
  });

  suite("when the cursor references a non-existing resource", () => {
    test("should return arguments_associated_resources_not_found error", async () => {
      const createOrg = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `${faker.company.name()} ${faker.string.ulid()}`,
              description: "Cursor not found test",
              countryCode: "us",
              state: "CA",
              city: "LA",
              postalCode: "90001",
              addressLine1: "456 Main St",
            },
          },
        },
      );

      const orgId = createOrg.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      const fakeCursor = Buffer.from(
        JSON.stringify({
          id: faker.string.uuid(),
          name: `ghost-folder-${faker.string.uuid()}`,
        }),
      ).toString("base64url");

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { id: orgId },
          first: 2,
          after: fakeCursor,
        },
      });

      expect(result.data?.organization?.tagFolders ?? null).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "arguments_associated_resources_not_found",
            }),
            path: ["organization", "tagFolders"],
          }),
        ]),
      );
    });
  });

  suite("when the client is authorized", () => {
    test("should return empty result when organization has no tag folders", async () => {
      const createOrg = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `${faker.company.name()} ${faker.string.ulid()}`,
              description: "Empty tagFolders test",
              countryCode: "us",
              state: "CA",
              city: "SF",
              postalCode: "94101",
              addressLine1: "789 Market St",
            },
          },
        },
      );

      const orgId = createOrg.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { organizationId: orgId },
        },
      });

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { id: orgId },
          first: 10,
        },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.organization.tagFolders.edges.length).toBe(0);
      expect(result.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        false,
      );
      expect(result.data.organization.tagFolders.pageInfo.hasPreviousPage).toBe(
        false,
      );
    });

    test("should return tag folders successfully (forward pagination)", async () => {
      const createOrg = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `${faker.company.name()} ${faker.string.ulid()}`,
              description: "TagFolders success test",
              countryCode: "us",
              state: "CA",
              city: "SF",
              postalCode: "94101",
              addressLine1: "789 Market St",
            },
          },
        },
      );

      orgId = createOrg.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { organizationId: orgId },
        },
      });

      // Create tag folders ONCE (no duplicates)
      for (let i = 0; i < 5; i++) {
        await mercuriusClient.mutate(Mutation_createTagFolder, {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              organizationId: orgId,
              name: `Folder ${String(i).padStart(2, "0")}`,
            },
          },
        });
      }

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { id: orgId },
          first: 3,
        },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.organization.tagFolders.edges.length).toBe(3);
      expect(result.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        true,
      );
      expect(result.data.organization.tagFolders.pageInfo.hasPreviousPage).toBe(
        false,
      );
    });

    test("should support cursor-based pagination", async () => {
      assertToBeNonNullish(orgId);

      const initialResult = await mercuriusClient.query(
        OrganizationTagFoldersQuery,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 10,
          },
        },
      );

      expect(initialResult.errors).toBeUndefined();

      const edges = initialResult.data.organization.tagFolders.edges;
      expect(edges.length).toBeGreaterThan(1);

      const cursor = edges[0].cursor;
      expect(cursor).toBeDefined();

      const paginatedResult = await mercuriusClient.query(
        OrganizationTagFoldersQuery,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
            after: cursor,
          },
        },
      );

      expect(paginatedResult.errors).toBeUndefined();
      expect(
        paginatedResult.data.organization.tagFolders.edges.length,
      ).toBeGreaterThan(0);

      // Verify that pagination moved forward (different nodes)
      expect(
        paginatedResult.data.organization.tagFolders.edges[0].node.id,
      ).not.toBe(edges[0].node.id);
    });

    test("should support backward pagination with last/before", async () => {
      assertToBeNonNullish(orgId);

      // First fetch all tag folders to get a valid cursor
      const initialResult = await mercuriusClient.query(
        OrganizationTagFoldersQuery,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 10,
          },
        },
      );

      expect(initialResult.errors).toBeUndefined();

      const edges = initialResult.data.organization.tagFolders.edges;
      expect(edges.length).toBeGreaterThan(2);

      // Use the LAST cursor to paginate backwards
      const lastCursor = edges[edges.length - 1].cursor;
      expect(lastCursor).toBeDefined();

      const backwardResult = await mercuriusClient.query(
        OrganizationTagFoldersQuery,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            last: 2,
            before: lastCursor,
          },
        },
      );

      expect(backwardResult.errors).toBeUndefined();

      const backwardEdges = backwardResult.data.organization.tagFolders.edges;

      expect(backwardEdges.length).toBe(2);
      expect(
        backwardResult.data.organization.tagFolders.pageInfo.hasNextPage,
      ).toBe(true);
    });

    test("should handle single page of results correctly", async () => {
      const createOrg = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `${faker.company.name()} ${faker.string.ulid()}`,
              description: "Single page tagFolders test",
              countryCode: "us",
              state: "CA",
              city: "SF",
              postalCode: "94101",
              addressLine1: "123 Single St",
            },
          },
        },
      );

      const singlePageOrgId = createOrg.data?.createOrganization?.id;
      assertToBeNonNullish(singlePageOrgId);

      await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { organizationId: singlePageOrgId },
        },
      });

      // Create only 2 tag folders
      for (let i = 0; i < 2; i++) {
        await mercuriusClient.mutate(Mutation_createTagFolder, {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              organizationId: singlePageOrgId,
              name: `Single Folder ${String(i).padStart(2, "0")}`,
            },
          },
        });
      }

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: { id: singlePageOrgId },
          first: 10,
        },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.organization.tagFolders.edges.length).toBe(2);
      expect(result.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        false,
      );
      expect(result.data.organization.tagFolders.pageInfo.hasPreviousPage).toBe(
        false,
      );
    });

    test("should handle multi-page results with correct pageInfo", async () => {
      assertToBeNonNullish(orgId);

      // Fetch first page
      const firstPage = await mercuriusClient.query(
        OrganizationTagFoldersQuery,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
          },
        },
      );

      expect(firstPage.errors).toBeUndefined();
      expect(firstPage.data.organization.tagFolders.edges.length).toBe(2);
      expect(firstPage.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        true,
      );
      expect(
        firstPage.data.organization.tagFolders.pageInfo.hasPreviousPage,
      ).toBe(false);

      // Fetch second page
      const secondPage = await mercuriusClient.query(
        OrganizationTagFoldersQuery,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
            after: firstPage.data.organization.tagFolders.edges[1].cursor,
          },
        },
      );

      expect(secondPage.errors).toBeUndefined();
      expect(
        secondPage.data.organization.tagFolders.edges.length,
      ).toBeGreaterThan(0);
      expect(
        secondPage.data.organization.tagFolders.pageInfo.hasPreviousPage,
      ).toBe(true);
    });
  });

  suite("when a non-admin non-member accesses tag folders", () => {
    test("should return unauthorized_action error", async () => {
      // Create a second regular user
      const { authToken: secondUserToken } =
        await import("../createRegularUserUsingAdmin").then((m) =>
          m.createRegularUserUsingAdmin(),
        );

      assertToBeNonNullish(secondUserToken);
      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        headers: { authorization: `bearer ${secondUserToken}` },
        variables: {
          input: { id: orgId },
          first: 2,
        },
      });

      expect(result.data?.organization?.tagFolders ?? null).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "unauthorized_action",
            }),
            path: ["organization", "tagFolders"],
          }),
        ]),
      );
    });
  });

  suite("when the authenticated user no longer exists", () => {
    test("should return unauthenticated error", async () => {
      // Create a regular user
      const { authToken: userToken } =
        await import("../createRegularUserUsingAdmin").then((m) =>
          m.createRegularUserUsingAdmin(),
        );

      assertToBeNonNullish(userToken);

      // Delete the user
      await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
        headers: { authorization: `bearer ${userToken}` },
      });

      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.query(OrganizationTagFoldersQuery, {
        headers: { authorization: `bearer ${userToken}` },
        variables: {
          input: { id: orgId },
          first: 2,
        },
      });

      expect(result.data?.organization?.tagFolders ?? null).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "unauthenticated",
            }),
            path: ["organization", "tagFolders"],
          }),
        ]),
      );
    });
  });
});
