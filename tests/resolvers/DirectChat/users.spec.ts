import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/DirectChat/users";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestDirectChatType } from "../../helpers/directChat";
import { createTestDirectChatMessage } from "../../helpers/directChat";

let testDirectChat: TestDirectChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgChat = await createTestDirectChatMessage();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> DirectChat -> users", () => {
  it(`returns user object for parent.users`, async () => {
    const parent = testDirectChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const usersPayload = await usersResolver?.(parent, {}, {});

    const users = await User.find({
      _id: {
        $in: testDirectChat?.users,
      },
    }).lean();

    expect(usersPayload).toEqual(users);
  });
});
