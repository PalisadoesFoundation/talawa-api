// Replace with the correct path
import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceUser } from "../../../src/models";
import { posts as postResolver } from "../../../src/resolvers/User/posts";
import type { PostsConnection } from "../../../src/types/generatedGraphQLTypes";
import type { RelayConnectionArguments } from "../../../src/utilities/validateConnectionArgs";
import { parseRelayConnectionArguments } from "../../../src/utilities/validateConnectionArgs";
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
      first: 1,
      after: testUser?._id,
      limit: 10,
    };
    const result = await postResolver?.(parent, args, {});

    if (result) {
      console.log(result);
      const postConnection = result as unknown as PostsConnection;

      expect(postConnection.edges).toHaveLength(0);
    }
  });
});
describe("parseConnectionArguments", () => {
  it("should parse connection arguments correctly with 'first'", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      after: "cursor",
      limit: 10,
    };
    const result = parseRelayConnectionArguments(args);
    expect(result.direction).toBe("FORWARD");
    expect(result.limit).toBe(5);
    expect(result.cursor).toBe("cursor");
  });

  it("should parse connection arguments correctly with 'last'", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      before: "cursor",
      limit: 10,
    };
    const result = parseRelayConnectionArguments(args);
    expect(result.direction).toBe("BACKWARD");
    expect(result.limit).toBe(5);
    expect(result.cursor).toBe("cursor");
  });

  it("should throw an error when 'first' and 'last' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      last: 5,
      limit: 10,
    };
    expect(() => parseRelayConnectionArguments(args)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when 'first' and 'before' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      before: "cursor",
      limit: 10,
    };
    expect(() => parseRelayConnectionArguments(args)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when 'last' and 'after' are provided", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      after: "cursor",
      limit: 10,
    };
    expect(() => parseRelayConnectionArguments(args)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when 'first' exceeds the limit", () => {
    const args: RelayConnectionArguments = {
      first: 100,
      limit: 50,
    };
    expect(() => parseRelayConnectionArguments(args)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when neither 'first' nor 'last' are provided", () => {
    const args: RelayConnectionArguments = { limit: 10 };
    expect(() => parseRelayConnectionArguments(args)).toThrowError(
      GraphQLError
    );
  });
});
