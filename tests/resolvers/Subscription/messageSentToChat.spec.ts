import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import type { TestChatMessageType } from "../../helpers/chat";
import { createTestChatMessage } from "../../helpers/chat";
import type { TestUserType } from "../../helpers/userAndOrg";
import { filterFunction } from "../../../src/resolvers/Subscription/messageSentToChat";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testChatMessage: TestChatMessageType;
let testCurrentUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestChatMessage();
  testCurrentUser = resultArray[0];
  testChatMessage = resultArray[3];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("src -> resolvers -> Subscription -> messageSentToChat", () => {
  it("subscription filter function returns true if CurrentUser is receiveror sender", async () => {
    const { messageSentToChat: messageSentToChatPayload } = await import(
      "../../../src/resolvers/Subscription/messageSentToChat"
    );

    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncIterator: (_action: "MESSAGE_SENT_TO_CHAT"): string => {
          return _action;
        },
      },
      context: { currentUserId: testCurrentUser?._id },
    };
    const variables = {
      userId: testCurrentUser?._id,
    };
    const payload = {
      messageSentToChat: {
        chatMessageBelongsTo: testChatMessage?.chatMessageBelongsTo as string,
      },
    };
    // @ts-expect-error-ignore
    messageSentToChatPayload.payload = payload;
    // @ts-expect-error-ignore
    const x = messageSentToChatPayload?.subscribe(_parent, _args, context);
    expect(x).not.toBe(null);
    expect(await filterFunction(payload, variables)).toBe(true);
  });

  it("user is not notified if it is not a part of DirectChat", async () => {
    const { messageSentToChat: messageSentToChatPayload } = await import(
      "../../../src/resolvers/Subscription/messageSentToChat"
    );

    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncIterator: (_action: "MESSAGE_SENT_TO_CHAT"): string => {
          return _action;
        },
      },
      context: { currentUserId: testCurrentUser?._id },
    };
    const variables = {
      userId: testCurrentUser?._id,
    };

    const payload = {
      messageSentToChat: {
        chatMessageBelongsTo: new Types.ObjectId().toString(),
      },
    };
    // @ts-expect-error-ignore
    messageSentToChatPayload.payload = payload;
    // @ts-expect-error-ignore
    const x = messageSentToChatPayload?.subscribe(_parent, _args, context);
    expect(x).not.toBe(null);
    expect(await filterFunction(payload, variables)).toBe(false);
  });
});
