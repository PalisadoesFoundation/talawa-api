import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/GroupChat/users";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestGroupChatMessage,
  testGroupChatMessageType,
} from "../../helpers/groupChat";

let testGroupChat: testGroupChatMessageType;

beforeAll(async () => {
  await connect();
  const resultArray = await createTestGroupChatMessage();
  testGroupChat = resultArray[3];
});

afterAll(async () => {
  await disconnect();
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
