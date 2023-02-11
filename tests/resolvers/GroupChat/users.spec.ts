import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/GroupChat/users";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestGroupChat,
  testGroupChatType,
} from "../../helpers/groupChat";

let testGroupChat: testGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> GroupChat -> users", () => {
  it(`returns user objects for parent.users`, async () => {
    const parent = testGroupChat!.toObject();

    const usersPayload = await usersResolver?.(parent, {}, {});

    const users = await User.find({
      _id: {
        $in: testGroupChat!.users,
      },
    }).lean();

    expect(usersPayload).toEqual(users);
  });
});
