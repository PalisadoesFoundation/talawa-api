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
  Query_organization_tagFolders,
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
      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          variables: {
            input: { id: orgId },
            first: 2,
          },
        },
      );

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

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
            after: "not-a-valid-base64",
          },
        },
      );

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

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
            after: fakeCursor,
          },
        },
      );

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
    beforeAll(async () => {
      const createOrg = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `${faker.company.name()} ${faker.string.ulid()}`,
              description: "Shared tagFolders setup",
              countryCode: "us",
              state: "CA",
              city: "SF",
              postalCode: "94101",
              addressLine1: "Shared Setup St",
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

      // Create tag folders once for shared use in pagination tests
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
    });

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

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 10,
          },
        },
      );

      expect(result.errors).toBeUndefined();
      assertToBeNonNullish(result.data?.organization?.tagFolders?.edges);
      expect(result.data.organization.tagFolders.edges.length).toBe(0);
      expect(result.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        false,
      );
      expect(result.data.organization.tagFolders.pageInfo.hasPreviousPage).toBe(
        false,
      );
      expect(
        result.data.organization.tagFolders.pageInfo.startCursor,
      ).toBeNull();
      expect(result.data.organization.tagFolders.pageInfo.endCursor).toBeNull();
    });

    test("should return tag folders successfully (forward pagination)", async () => {
      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 3,
          },
        },
      );

      expect(result.errors).toBeUndefined();
      assertToBeNonNullish(result.data?.organization?.tagFolders?.edges);
      expect(result.data.organization.tagFolders.edges.length).toBe(3);
      expect(result.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        true,
      );
      expect(result.data.organization.tagFolders.pageInfo.hasPreviousPage).toBe(
        false,
      );
      expect(
        result.data.organization.tagFolders.pageInfo.startCursor,
      ).toBeDefined();
      expect(
        result.data.organization.tagFolders.pageInfo.endCursor,
      ).toBeDefined();
    });

    test("should support cursor-based pagination", async () => {
      assertToBeNonNullish(orgId);

      const initialResult = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 10,
          },
        },
      );

      expect(initialResult.errors).toBeUndefined();
      assertToBeNonNullish(initialResult.data?.organization?.tagFolders?.edges);
      const edges = initialResult.data.organization.tagFolders.edges;
      expect(edges.length).toBeGreaterThan(1);

      assertToBeNonNullish(edges[0]);
      const cursor = edges[0].cursor;
      expect(cursor).toBeDefined();

      const paginatedResult = await mercuriusClient.query(
        Query_organization_tagFolders,
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
      assertToBeNonNullish(
        paginatedResult.data?.organization?.tagFolders?.edges,
      );
      expect(
        paginatedResult.data.organization.tagFolders.edges.length,
      ).toBeGreaterThan(0);

      const paginatedEdges = paginatedResult.data.organization.tagFolders.edges;

      // Verify that pagination moved forward (different nodes)
      assertToBeNonNullish(paginatedEdges[0]?.node);
      assertToBeNonNullish(edges[0]?.node);
      expect(paginatedEdges[0].node.id).not.toBe(edges[0].node.id);
    });

    test("should support backward pagination with last/before", async () => {
      assertToBeNonNullish(orgId);

      // First fetch all tag folders to get a valid cursor
      const initialResult = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 10,
          },
        },
      );

      expect(initialResult.errors).toBeUndefined();
      assertToBeNonNullish(initialResult.data?.organization?.tagFolders?.edges);
      const edges = initialResult.data.organization.tagFolders.edges;
      expect(edges.length).toBeGreaterThan(2);

      // Use the LAST cursor to paginate backwards
      const lastEdge = edges[edges.length - 1];
      assertToBeNonNullish(lastEdge);
      const lastCursor = lastEdge.cursor;
      expect(lastCursor).toBeDefined();

      const backwardResult = await mercuriusClient.query(
        Query_organization_tagFolders,
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
      assertToBeNonNullish(
        backwardResult.data?.organization?.tagFolders?.edges,
      );
      const backwardEdges = backwardResult.data.organization.tagFolders.edges;

      expect(backwardEdges.length).toBe(2);
      expect(
        backwardResult.data.organization.tagFolders.pageInfo.hasNextPage,
      ).toBe(true);
      expect(
        backwardResult.data.organization.tagFolders.pageInfo.hasPreviousPage,
      ).toBe(true);
      expect(
        backwardResult.data.organization.tagFolders.pageInfo.startCursor,
      ).toBeDefined();
      expect(
        backwardResult.data.organization.tagFolders.pageInfo.endCursor,
      ).toBeDefined();
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

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: singlePageOrgId },
            first: 10,
          },
        },
      );

      expect(result.errors).toBeUndefined();
      assertToBeNonNullish(result.data?.organization?.tagFolders?.edges);
      expect(result.data.organization.tagFolders.edges.length).toBe(2);
      expect(result.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        false,
      );
      expect(result.data.organization.tagFolders.pageInfo.hasPreviousPage).toBe(
        false,
      );
      expect(
        result.data.organization.tagFolders.pageInfo.startCursor,
      ).toBeDefined();
      expect(
        result.data.organization.tagFolders.pageInfo.endCursor,
      ).toBeDefined();
    });

    test("should handle multi-page results with correct pageInfo", async () => {
      assertToBeNonNullish(orgId);

      // Fetch first page
      const firstPage = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
          },
        },
      );

      expect(firstPage.errors).toBeUndefined();
      assertToBeNonNullish(firstPage.data?.organization?.tagFolders?.edges);
      expect(firstPage.data.organization.tagFolders.edges.length).toBe(2);
      expect(firstPage.data.organization.tagFolders.pageInfo.hasNextPage).toBe(
        true,
      );
      expect(
        firstPage.data.organization.tagFolders.pageInfo.hasPreviousPage,
      ).toBe(false);
      expect(
        firstPage.data.organization.tagFolders.pageInfo.startCursor,
      ).toBeDefined();
      expect(
        firstPage.data.organization.tagFolders.pageInfo.endCursor,
      ).toBeDefined();

      // Fetch second page
      assertToBeNonNullish(firstPage.data?.organization?.tagFolders?.edges);
      assertToBeNonNullish(firstPage.data.organization.tagFolders.edges[1]);
      const secondPage = await mercuriusClient.query(
        Query_organization_tagFolders,
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
      assertToBeNonNullish(secondPage.data?.organization?.tagFolders?.edges);
      expect(
        secondPage.data.organization.tagFolders.edges.length,
      ).toBeGreaterThan(0);
      expect(
        secondPage.data.organization.tagFolders.pageInfo.hasPreviousPage,
      ).toBe(true);
      expect(
        secondPage.data.organization.tagFolders.pageInfo.startCursor,
      ).toBeDefined();
      expect(
        secondPage.data.organization.tagFolders.pageInfo.endCursor,
      ).toBeDefined();
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

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${secondUserToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
          },
        },
      );

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

      const result = await mercuriusClient.query(
        Query_organization_tagFolders,
        {
          headers: { authorization: `bearer ${userToken}` },
          variables: {
            input: { id: orgId },
            first: 2,
          },
        },
      );

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
