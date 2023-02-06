import "dotenv/config";
import { describe, it, expect } from "vitest";

describe("src -> resolvers -> Subscription -> messageSentToDirectChat", () => {
  it("should return true when currentUserId is either the receiver or the sender of the message", async () => {
    const { messageSentToDirectChat: messageSentToDirectChatPayload } =
      await import(
        "../../../src/resolvers/Subscription/messageSentToDirectChat"
      );
    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncInterator: (_action: "MESSAGE_SENT_TO_DIRECT_CHAT") => {
          return;
        },
      },
      context: "currentUserId",
    };
    const payload = {
      messageSentToDirectChat: {
        reciever: "currentUserId",
        sender: "senderId",
      },
    };
    // @ts-ignore
    messageSentToDirectChatPayload._parent = _parent;
    // @ts-ignore
    messageSentToDirectChatPayload._args = _args;
    // @ts-ignore
    messageSentToDirectChatPayload.payload = payload;
    // @ts-ignore
    messageSentToDirectChatPayload.context = context;
    // @ts-ignore
    const x = messageSentToDirectChatPayload?.subscribe;

    expect(x()).not.toBe(false);
  });

  it("should return false when currentUserId is neither the receiver nor the sender of the message", async () => {
    const { messageSentToDirectChat: messageSentToDirectChatPayload } =
      await import(
        "../../../src/resolvers/Subscription/messageSentToDirectChat"
      );
    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncInterator: (_action: "MESSAGE_SENT_TO_DIRECT_CHAT") => {
          return;
        },
      },
      context: "currentUserId",
    };
    const payload = {
      messageSentToDirectChat: {
        reciever: "receiverId",
        sender: "senderId",
      },
    };
    // @ts-ignore
    messageSentToDirectChatPayload._parent = _parent;
    // @ts-ignore
    messageSentToDirectChatPayload._args = _args;
    // @ts-ignore
    messageSentToDirectChatPayload.payload = payload;
    // @ts-ignore
    messageSentToDirectChatPayload.context = context;
    // @ts-ignore
    const x = messageSentToDirectChatPayload?.subscribe;
    expect(x()).not.toBe(true);
  });
});
