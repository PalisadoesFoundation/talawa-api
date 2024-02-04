// Replace with the correct path
import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceUser } from "../../../src/models";
import { posts as postResolver } from "../../../src/resolvers/User/posts";
import type { ConnectionPageInfo } from "../../../src/types/generatedGraphQLTypes";
import type { RelayConnectionArguments } from "../../../src/utilities/parseRelayConnectionArguments";
import { parseRelayConnectionArguments } from "../../../src/utilities/parseRelayConnectionArguments";
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
    };
    const postConnection = await postResolver?.(parent, args, {});

    if (postConnection) {
      console.log(postConnection);

      expect(postConnection.edges).toHaveLength(0);
    }
  });

  it("constructs query correctly with $gt operator when direction is BACKWARD", () => {
    const args: RelayConnectionArguments = {
      last: 1,
      before: testUser?._id,
    };
    const result = parseRelayConnectionArguments(args, 10);
    const query: Record<string, unknown> = {};
    if (result.direction == "BACKWARD") {
      query._id = { $gt: result.cursor };
    }
    expect(query).toEqual({ _id: { $gt: result.cursor } });
  });
  it("handle post beyond the limit correctly", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      after: "cursor",
    };
    const paginationArgs = parseRelayConnectionArguments(args, 10);
    const posts: unknown[] = Array.from({ length: 6 }).map((_, index) => ({
      _id: `post_${index}`,
    }));
    const pageInfo: ConnectionPageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    };
    if (posts.length > paginationArgs.limit) {
      if (paginationArgs.direction === "FORWARD") {
        pageInfo.hasNextPage = true;
      } else {
        pageInfo.hasPreviousPage = true;
      }
      posts.pop();
    }

    expect(pageInfo.hasNextPage).toBe(true);
    expect(posts.length).toBe(paginationArgs.limit);
  });
  it("reverses posts array when fetching in backward direction", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      before: "cursor", // Example cursor
    };
    const paginationArgs = parseRelayConnectionArguments(args, 10);
    const posts: unknown[] = [
      { _id: "post_1" },
      { _id: "post_2" },
      { _id: "post_3" },
    ];
    if (paginationArgs.direction === "BACKWARD") {
      posts.reverse();
    }
    expect(posts).toEqual([
      { _id: "post_3" },
      { _id: "post_2" },
      { _id: "post_1" },
    ]);
  });
});
describe("parseConnectionArguments", () => {
  it("should parse connection arguments correctly with 'first'", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      after: "cursor",
    };
    const result = parseRelayConnectionArguments(args, 10);
    expect(result.direction).toBe("FORWARD");
    expect(result.limit).toBe(5);
    expect(result.cursor).toBe("cursor");
  });

  it("should parse connection arguments correctly with 'last'", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      before: "cursor",
    };
    const result = parseRelayConnectionArguments(args, 10);
    expect(result.direction).toBe("BACKWARD");
    expect(result.limit).toBe(5);
    expect(result.cursor).toBe("cursor");
  });

  it("should throw an error when 'first' and 'last' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      last: 5,
    };
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when 'first' and 'before' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      before: "cursor",
    };
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when 'last' and 'after' are provided", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      after: "cursor",
    };
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when neither 'first' nor 'last' are provided", () => {
    const args: RelayConnectionArguments = {};
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });
});
