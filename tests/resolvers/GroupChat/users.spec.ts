import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/GroupChat/users";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestGroupChatType } from "../../helpers/groupChat";
import { createTestGroupChat } from "../../helpers/groupChat";

let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> GroupChat -> users", () => {
  it(`returns user objects for parent.users`, async () => {
    const parent = testGroupChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const usersPayload = await usersResolver?.(parent, {}, {});

    const users = await User.find({
      _id: {
        $in: testGroupChat?.users,
      },
    }).lean();

    expect(usersPayload).toEqual(users);
  });
});
