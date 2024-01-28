// Replace with the correct path
import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfacePost, InterfaceUser } from "../../../src/models";
import { posts as postResolver } from "../../../src/resolvers/User/post";
import type { PostsConnection } from "../../../src/types/generatedGraphQLTypes";
import type { RelayConnectionArguments } from "../../../src/utilities/validateConnectionArgs";
import { parseConnectionArguments } from "../../../src/utilities/validateConnectionArgs";
import { connect, disconnect } from "../../helpers/db";
import { createTestPost } from "../../helpers/posts";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgAndPost = await createTestPost();
  testUser = userOrgAndPost[0];
});

afterAll(async () => {
  // Clean up after the tests
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> User -> post", () => {
  it("returns posts created by the user", async () => {
    const parent = testUser?.toObject() as InterfaceUser;
    const args: RelayConnectionArguments = {
      first: 10,
      after: testUser?._id,
    };
    const result = await postResolver?.(parent, args, {});

    if (result) {
      const postConnection = result as unknown as PostsConnection;
      console.log(postConnection.edges[0].node);
      expect(postConnection.edges).toHaveLength(1);
      expect(
        (postConnection.edges[0]?.node as unknown as InterfacePost).creatorId
      ).toStrictEqual(parent?._id);
    }
  });
});
describe("parseConnectionArguments", () => {
  it("should parse connection arguments correctly with 'first'", () => {
    const args: RelayConnectionArguments = {
      first: 10,
      after: "cursor",
    };
    const result = parseConnectionArguments(args);
    expect(result.direction).toBe("FORWARD");
    expect(result.limit).toBe(10);
    expect(result.cursor).toBe("cursor");
  });

  it("should parse connection arguments correctly with 'last'", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      before: "cursor",
    };
    const result = parseConnectionArguments(args);
    expect(result.direction).toBe("BACKWARD");
    expect(result.limit).toBe(5);
    expect(result.cursor).toBe("cursor");
  });

  it("should throw an error when 'first' and 'last' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 10,
      last: 5,
    };
    expect(() => parseConnectionArguments(args)).toThrowError(GraphQLError);
  });

  it("should throw an error when 'first' and 'before' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 10,
      before: "cursor",
    };
    expect(() => parseConnectionArguments(args)).toThrowError(GraphQLError);
  });

  it("should throw an error when 'last' and 'after' are provided", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      after: "cursor",
    };
    expect(() => parseConnectionArguments(args)).toThrowError(GraphQLError);
  });

  it("should throw an error when 'first' exceeds the limit", () => {
    const args: RelayConnectionArguments = {
      first: 100, // Assuming the limit is 50
    };
    expect(() => parseConnectionArguments(args)).toThrowError(GraphQLError);
  });

  it("should throw an error when neither 'first' nor 'last' are provided", () => {
    const args: RelayConnectionArguments = {};
    expect(() => parseConnectionArguments(args)).toThrowError(GraphQLError);
  });
});
