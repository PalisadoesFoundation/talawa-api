import "dotenv/config";
import { describe, it, expect } from "vitest";

describe("src -> resolvers -> Subscription -> directMessageChat", () => {
  it("should return payload", async () => {
    const { directMessageChat: directMessageChatPayload } = await import(
      "../../../src/resolvers/Subscription/directMessageChat"
    );
    const _args: Record<string, unknown> = {};
    const _parent: unknown = {};
    const context = {
      pubsub: {
        asyncIterator: (chatChannel: string): AsyncIterableIterator<string> => {
          return chatChannel;
        },
      },
    };
    // @ts-ignore (if necessary)
    const x = directMessageChatPayload?.subscribe(_parent, _args, context);
    expect(x).not.toBe(null);
  });
});
