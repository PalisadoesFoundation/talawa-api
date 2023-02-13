import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/GroupChat/creator";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
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
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
