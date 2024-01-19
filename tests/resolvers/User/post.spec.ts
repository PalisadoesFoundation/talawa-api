// Replace with the correct path
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfacePost, InterfaceUser } from "../../../src/models";
import { post as postResolver } from "../../../src/resolvers/User/post";
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
      expect(result).toHaveLength(1);
      expect((result[0] as InterfacePost)?.creatorId).toBe(parent?._id);
    }
  });
});
