import "dotenv/config";
import { groupChats as groupChatsResolver } from "../../../src/resolvers/Query/groupChats";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { GroupChat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroupChat } from "../../helpers/groupChat";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestGroupChat();
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> groupChats", () => {
  it(`returns list of all existing groupChats`, async () => {
    const groupChatsPayload = await groupChatsResolver?.({}, {}, {});

    const groupChats = await GroupChat.find().lean();

    expect(groupChatsPayload).toEqual(groupChats);
  });
});
