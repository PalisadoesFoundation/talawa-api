// Replace with the correct path

import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Post, type InterfaceUser } from "../../../src/models";
import {
  parseCursor,
  posts as postResolver,
} from "../../../src/resolvers/User/posts";
import type { PostEdge } from "../../../src/types/generatedGraphQLTypes";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import { createTestPost, type TestPostType } from "../../helpers/posts";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPost: TestPostType;
let testPost2: TestPostType;
let testPost3: TestPostType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  const userOrgAndPost = await createTestPost();
  testUser = userOrgAndPost[0];
  testOrganization = userOrgAndPost[1];
  testPost = userOrgAndPost[2];
  testPost2 = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    creatorId: testUser?._id,
    organization: testOrganization?._id,
    pinned: false,
  });
  testPost3 = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    creatorId: testUser?._id,
    organization: testOrganization?._id,
    pinned: false,
  });
});

afterAll(async () => {
  // Clean up after the tests
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> User -> post", () => {
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    try {
      const parent = testUser?.toObject() as InterfaceUser;
      await postResolver?.(parent, {}, {});
    } catch (error) {
      if (error instanceof GraphQLError) {
        expect(error.extensions?.code).toEqual("INVALID_ARGUMENTS");
        expect(
          (error.extensions?.errors as DefaultGraphQLArgumentError[]).length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it(`returns the expected connection object`, async () => {
    const parent = testUser as InterfaceUser;
    const connection = await postResolver?.(
      parent,
      {
        first: 3,
      },
      {},
    );
    const totalCount = await Post.find({
      creatorId: testUser?._id,
    }).countDocuments();

    // Log the specific properties of the connection object and the expected value

    // Check individual properties
    // console.log(connection?.edges[0]);
    expect((connection?.edges[0] as unknown as PostEdge).cursor).toEqual(
      testPost3?._id.toString(),
    );
    expect((connection?.edges[1] as unknown as PostEdge).cursor).toEqual(
      testPost2?._id.toString(),
    );
    expect((connection?.edges[2] as unknown as PostEdge).cursor).toEqual(
      testPost?._id.toString(),
    );
    expect(connection?.pageInfo.endCursor).toEqual(testPost?._id.toString());
    expect(connection?.pageInfo.hasNextPage).toBe(false);
    expect(connection?.pageInfo.hasPreviousPage).toBe(false);
    expect(connection?.pageInfo.startCursor).toEqual(testPost3?._id.toString());
    expect(connection?.totalCount).toEqual(totalCount);
  });

  it("returns an empty connection object if no posts are found", async () => {
    await Post.deleteMany({ creatorId: testUser?._id });
    const parent = testUser as InterfaceUser;
    const connection = await postResolver?.(parent, { first: 2 }, {});

    expect(connection?.edges).toHaveLength(0);
    expect(connection?.totalCount).toEqual(0);
    expect(connection?.pageInfo.endCursor).toBeNull();
    expect(connection?.pageInfo.startCursor).toBeNull();
    expect(connection?.pageInfo.hasNextPage).toBe(false);
    expect(connection?.pageInfo.hasPreviousPage).toBe(false);
  });

  it("handles different pagination arguments correctly", async () => {
    // Recreate posts for pagination testing
    testPost = await Post.create({
      text: `text${nanoid().toLowerCase()}`,
      creatorId: testUser?._id,
      organization: testOrganization?._id,
      pinned: false,
    });
    testPost2 = await Post.create({
      text: `text${nanoid().toLowerCase()}`,
      creatorId: testUser?._id,
      organization: testOrganization?._id,
      pinned: false,
    });
    testPost3 = await Post.create({
      text: `text${nanoid().toLowerCase()}`,
      creatorId: testUser?._id,
      organization: testOrganization?._id,
      pinned: false,
    });

    const parent = testUser as InterfaceUser;

    const connectionFirst = await postResolver?.(parent, { first: 1 }, {});
    expect(connectionFirst?.edges).toHaveLength(1);
    expect(connectionFirst?.pageInfo.hasNextPage).toBe(true);
    expect(connectionFirst?.pageInfo.hasPreviousPage).toBe(false);

    const connectionLast = await postResolver?.(parent, { last: 1 }, {});
    expect(connectionLast?.edges).toHaveLength(1);
    expect(connectionLast?.pageInfo.hasNextPage).toBe(false);
    expect(connectionLast?.pageInfo.hasPreviousPage).toBe(true);
  });

  it("throws an error for invalid cursor value", async () => {
    const parent = testUser as InterfaceUser;
    const args = { after: "invalidCursor", first: 10 };
    await expect(postResolver?.(parent, args, {})).rejects.toThrow();
  });

  it("handles valid cursor value", async () => {
    const parent = testUser as InterfaceUser;
    const args = { after: testPost2?._id.toString(), first: 10 };
    const connection = await postResolver?.(parent, args, {});
    expect(connection).toBeDefined();
    expect(connection?.edges.length).toBeGreaterThan(0);

    const allPostIds = [testPost, testPost2, testPost3].map((post) =>
      post?._id.toString(),
    );

    const returnedCursor = (connection?.edges[0] as unknown as PostEdge).cursor;
    expect(allPostIds).toContain(returnedCursor);
    expect(returnedCursor).not.toEqual(testPost2?._id.toString());
  });
});

it("handles missing cursor value gracefully", async () => {
  const parent = testUser as InterfaceUser;
  const args = { first: 10 };
  const connection = await postResolver?.(parent, args, {});
  expect(connection).toBeDefined();
  expect(connection?.edges.length).toBeGreaterThan(0);
});

it("handles cursor value with pagination arguments", async () => {
  const parent = testUser as InterfaceUser;
  const args = { after: testPost?._id.toString(), first: 2 };
  const connection = await postResolver?.(parent, args, {});
  expect(connection).toBeDefined();
  expect(connection?.edges.length).toBeLessThanOrEqual(2);
});

describe("parseCursor function", () => {
  it("returns failure state if argument cursorValue is an invalid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: new Types.ObjectId().toString(),
      creatorId: testUser?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(false);
    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns success state if argument cursorValue is a valid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: testPost?._id.toString() as string,
      creatorId: testUser?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(testPost?._id.toString());
    }
  });

  it("returns failure state if creatorId is invalid", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: testPost?._id.toString() as string,
      creatorId: new Types.ObjectId().toString(),
    });

    expect(result.isSuccessful).toEqual(false);
    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("handles empty string cursor value", async () => {
    try {
      await parseCursor({
        cursorName: "after",
        cursorPath: ["after"],
        cursorValue: "",
        creatorId: testUser?._id.toString() as string,
      });
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain("Cast to ObjectId failed");
    }
  });

  it("handles invalid ObjectId string as cursor value", async () => {
    try {
      await parseCursor({
        cursorName: "after",
        cursorPath: ["after"],
        cursorValue: "invalidObjectId",
        creatorId: testUser?._id.toString() as string,
      });
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain("Cast to ObjectId failed");
    }
  });

  it("handles non-existent ObjectId as cursor value", async () => {
    const nonExistentId = new Types.ObjectId().toString();
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: nonExistentId,
      creatorId: testUser?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(false);
    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
