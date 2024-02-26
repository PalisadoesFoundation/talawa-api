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

describe("resolvers -> User -> post", () => {
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    try {
      const parent = testUser?.toObject() as InterfaceUser;
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
    const parent = testUser as InterfaceUser;
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

    // Log the specific properties of the connection object and the expected value

    // Check individual properties

    expect(connection).toEqual({
      edges: [
        {
          cursor: testPost2?._id.toString(),
          node: {
            ...testPost2,
            _id: testPost2?._id.toString(),
          },
        },
        {
          cursor: testPost?._id.toString(),
          node: {
            ...testPost,
            _id: testPost?._id.toString(),
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
  });
});
describe("parseCursor function", () => {
  it("returns failure state if argument cursorValue is an invalid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: Types.ObjectId().toString(),
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
});
