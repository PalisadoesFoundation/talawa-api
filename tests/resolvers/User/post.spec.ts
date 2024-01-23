// Replace with the correct path
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfacePost, InterfaceUser } from "../../../src/models";
import { posts as postResolver } from "../../../src/resolvers/User/post";
import type { PostConnection } from "../../../src/types/generatedGraphQLTypes";
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

    const result = await postResolver?.(parent, {}, {});

    if (result) {
      const postConnection = result as unknown as PostConnection;
      console.log(postConnection.edges[0].node);
      expect(postConnection.edges).toHaveLength(1);
      expect(
        (postConnection.edges[0]?.node as unknown as InterfacePost).creatorId
      ).toStrictEqual(parent?._id);
    }
  });
});
