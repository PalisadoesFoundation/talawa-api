// Replace with the correct path
import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Post, type InterfaceOrganization } from "../../../src/models";
import {
  parseCursor,
  posts as postResolver,
} from "../../../src/resolvers/Organization/posts";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import { connect, disconnect } from "../../helpers/db";
import { createTestPost, type TestPostType } from "../../helpers/posts";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPost: TestPostType;
let testPost2: TestPostType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
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
});

afterAll(async () => {
  // Clean up after the tests
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> post", () => {
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    try {
      const parent = testOrganization?.toObject() as InterfaceOrganization;
      await postResolver?.(parent, {}, {});
    } catch (error) {
      if (error instanceof GraphQLError) {
        expect(error.extensions.code).toEqual("INVALID_ARGUMENTS");
        expect(
          (error.extensions.errors as DefaultGraphQLArgumentError[]).length,
        ).toBeGreaterThan(0);
      }
    }
  });
  it(`returns the expected connection object`, async () => {
    const parent = testOrganization as InterfaceOrganization;
    const connection = await postResolver?.(
      parent,
      {
        first: 2,
      },
      {},
    );

    const totalCount = await Post.find({
      creatorId: testUser?._id,
    }).countDocuments();

    const formattedPost2 = testPost2?.toObject();
    const formattedPost = testPost?.toObject();

    expect(connection).toEqual({
      edges: [
        {
          cursor: formattedPost2?._id?.toString(),
          node: {
            ...formattedPost2,
            _id: formattedPost2?._id?.toString(),
          },
        },
        {
          cursor: formattedPost?._id?.toString(),
          node: {
            ...formattedPost,
            _id: formattedPost?._id?.toString(),
          },
        },
      ],
      pageInfo: {
        endCursor: testPost?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: testPost2?._id.toString(),
      },
      totalCount,
    });

    expect(connection?.pageInfo.endCursor).toEqual(testPost?._id.toString());
    expect(connection?.pageInfo.hasNextPage).toBe(false);
    expect(connection?.pageInfo.hasPreviousPage).toBe(false);
    expect(connection?.pageInfo.startCursor).toEqual(testPost2?._id.toString());
    expect(connection?.totalCount).toEqual(totalCount);
  });
});
describe("parseCursor function", () => {
  it("returns failure state if argument cursorValue is an invalid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: new Types.ObjectId().toString(),
      organization: testOrganization?._id.toString() as string,
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
      organization: testOrganization?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(testPost?._id.toString());
    }
  });
  it("throws GraphQLError when an invalid cursor is provided", async () => {
    const parent = {
      _id: testOrganization?._id,
    } as InterfaceOrganization;

    try {
      await postResolver?.(
        parent,
        {
          first: 2,
          after: new Types.ObjectId().toString(), // Invalid cursor
        },
        {},
      );
      // If we reach here, the test should fail because an error should have been thrown
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      if (error instanceof GraphQLError) {
        expect(error.extensions.code).toEqual("INVALID_ARGUMENTS");
        expect(
          (error.extensions.errors as DefaultGraphQLArgumentError[]).length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("successfully uses parseCursor with valid cursor", async () => {
    const parent = {
      _id: testOrganization?._id,
    } as InterfaceOrganization;

    const connection = await postResolver?.(
      parent,
      {
        first: 2,
        after: testPost2?._id.toString(), // Valid cursor
      },
      {},
    );

    expect(connection).toBeDefined();
    expect(connection?.edges.length).toBe(1);
  });
});
