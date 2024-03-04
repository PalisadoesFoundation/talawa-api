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
    console.log(connection, testPost2?._id, testPost?._id);
    const totalCount = await Post.find({
      creatorId: testUser?._id,
    }).countDocuments();

    // Log the specific properties of the connection object and the expected value

    // Check individual properties
    // console.log(connection?.edges[0]);

    expect((connection?.edges[0] as unknown as PostEdge).cursor).toEqual(
      testPost2?._id.toString(),
    );
    expect((connection?.edges[1] as unknown as PostEdge).cursor).toEqual(
      testPost?._id.toString(),
    );
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
