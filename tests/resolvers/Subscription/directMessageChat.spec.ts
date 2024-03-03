import "dotenv/config";
import { describe, it, expect } from "vitest";

describe("src -> resolvers -> Subscription -> directMessageChat", () => {
  it("should return payload", async () => {
    const { directMessageChat: directMessageChatPayload } = await import(
      "../../../src/resolvers/Subscription/directMessageChat"
    );
    const _args = {};
    const _parent = {};
    const context = {
      pubsub: {
        asyncIterator: (chatChannel: string): string => {
          return chatChannel;
        },
      },
    };
    //@ts-expect-error : This is directly calling the function
    const x = directMessageChatPayload?.subscribe(_parent, _args, context);
    expect(x).not.toBe(null);
  });
});
