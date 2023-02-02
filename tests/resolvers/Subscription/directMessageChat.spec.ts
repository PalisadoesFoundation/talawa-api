import "dotenv/config";
import { describe, it, expect } from "vitest";

describe("src -> resolvers -> Subscription -> directMessageChat", () => {
  it("should return payload", async () => {
    const { directMessageChat: directMessageChatPayload } = await import(
      "../../../src/resolvers/Subscription/directMessageChat"
    );
    const _args = {};
    const context = {
      pubsub: "hello",
    };
    const payload = {
      directMessageChat: true,
    };
    // @ts-ignore
    directMessageChatPayload.payload = payload;
    // @ts-ignore
    directMessageChatPayload.context = context;
    // @ts-ignore
    const x = directMessageChatPayload?.subscribe;

    expect(x()).not.toBe(null);
  });
});
