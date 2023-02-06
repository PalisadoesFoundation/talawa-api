import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/GroupChat/creator";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestGroupChat,
  testGroupChatType,
} from "../../helpers/groupChat";

let testGroupChat: testGroupChatType;

beforeAll(async () => {
  await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> GroupChat -> creator", () => {
  it(`returns user object for parent.creator`, async () => {
    const parent = testGroupChat!.toObject();

    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creator = await User.findOne({
      _id: testGroupChat!.creator,
    }).lean();

    expect(creatorPayload).toEqual(creator);
  });
});
