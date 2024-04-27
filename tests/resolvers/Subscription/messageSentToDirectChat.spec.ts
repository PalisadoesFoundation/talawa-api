import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import type { TestDirectChatMessageType } from "../../helpers/directChat";
import { createTestDirectChatMessage } from "../../helpers/directChat";
import type { TestUserType } from "../../helpers/userAndOrg";
import { filterFunction } from "../../../src/resolvers/Subscription/messageSentToDirectChat";

let MONGOOSE_INSTANCE: typeof mongoose;
let testDirectChatMessage: TestDirectChatMessageType;
let testCurrentUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestDirectChatMessage();
  testCurrentUser = resultArray[0];
  testDirectChatMessage = resultArray[3];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("src -> resolvers -> Subscription -> messageSentToDirectChat", () => {
  it("subscription filter function returns true if CurrentUser is receiveror sender", async () => {
    const { messageSentToDirectChat: messageSentToDirectChatPayload } =
      await import(
        "../../../src/resolvers/Subscription/messageSentToDirectChat"
      );

    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncIterator: (_action: "MESSAGE_SENT_TO_DIRECT_CHAT"): string => {
          return _action;
        },
      },
      context: { currentUserId: testCurrentUser?._id },
    };
    const payload = {
      messageSentToDirectChat: {
        receiver: testDirectChatMessage?.receiver,
        sender: testDirectChatMessage?.sender,
      },
    };
    // @ts-expect-error-ignore
    messageSentToDirectChatPayload.payload = payload;
    // @ts-expect-error-ignore
    const x = messageSentToDirectChatPayload?.subscribe(
      _parent,
      _args,
      context,
    );
    expect(x).not.toBe(null);
    expect(await filterFunction(payload, context)).toBe(true);

    // If current User is sender
    payload.messageSentToDirectChat.receiver = "receiver";
    expect(await filterFunction(payload, context)).toBe(true);
  });

  it("user is not notified if it is not a part of DirectChat", async () => {
    const { messageSentToDirectChat: messageSentToDirectChatPayload } =
      await import(
        "../../../src/resolvers/Subscription/messageSentToDirectChat"
      );

    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncIterator: (_action: "MESSAGE_SENT_TO_DIRECT_CHAT"): string => {
          return _action;
        },
      },
      context: { currentUserId: testCurrentUser?._id },
    };

    const payload = {
      messageSentToDirectChat: {
        receiver: "Receiver",
        sender: "Sender",
      },
    };
    // @ts-expect-error-ignore
    messageSentToDirectChatPayload.payload = payload;
    // @ts-expect-error-ignore
    const x = messageSentToDirectChatPayload?.subscribe(
      _parent,
      _args,
      context,
    );
    expect(x).not.toBe(null);
    expect(await filterFunction(payload, context)).toBe(false);
  });
});
