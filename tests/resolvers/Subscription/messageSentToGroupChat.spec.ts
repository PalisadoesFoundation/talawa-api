import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import type { TestGroupChatType } from "../../helpers/groupChat";
import { createTestGroupChatMessage } from "../../helpers/groupChat";
import { filterFunction } from "../../../src/resolvers/Subscription/messageSentToGroupChat";

let MONGOOSE_INSTANCE: typeof mongoose;
let testGroupChat: TestGroupChatType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testGroupChat = (await createTestGroupChatMessage())[2];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("src -> resolvers -> Subscription -> messageSentToGroupChat", () => {
  it("subscription filter function returns true", async () => {
    const { messageSentToGroupChat: messageSentToGroupChatPayload } =
      await import(
        "../../../src/resolvers/Subscription/messageSentToGroupChat"
      );

    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncIterator: (_action: "MESSAGE_SENT_TO_GROUP_CHAT"): string => {
          return _action;
        },
      },
      context: { currentUserId: testGroupChat?.users[0] },
    };
    const payload = {
      messageSentToGroupChat: {
        groupChatMessageBelongsTo: testGroupChat?._id,
      },
    };
    // @ts-expect-error-ignore
    messageSentToGroupChatPayload.payload = payload;
    // @ts-expect-error-ignore
    const x = messageSentToGroupChatPayload?.subscribe(_parent, _args, context);
    expect(x).not.toBe(null);
    expect(await filterFunction(payload, context)).toBe(true);
  });
  it("subscription filter function returns false when group chat not found with the id", async () => {
    const { messageSentToGroupChat: messageSentToGroupChatPayload } =
      await import(
        "../../../src/resolvers/Subscription/messageSentToGroupChat"
      );

    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncIterator: (_action: "MESSAGE_SENT_TO_GROUP_CHAT"): string => {
          return _action;
        },
      },
      context: { currentUserId: testGroupChat?.users[0] },
    };
    const payload = {
      messageSentToGroupChat: {
        groupChatMessageBelongsTo: new mongoose.Types.ObjectId(),
      },
    };
    // @ts-expect-error-ignore
    messageSentToGroupChatPayload.payload = payload;
    // @ts-expect-error-ignore
    const x = messageSentToGroupChatPayload?.subscribe(_parent, _args, context);
    expect(x).not.toBe(null);
    expect(await filterFunction(payload, context)).toBe(false);
  });
});
