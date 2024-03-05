import "dotenv/config";
import { describe, it, expect } from "vitest";

describe("src -> resolvers -> Subscription -> directMessageChat", () => {
  it("should return payload", async () => {
    const { directMessageChat: directMessageChatPayload } = await import(
      "../../../src/resolvers/Subscription/directMessageChat"
    );

    // **Type assertion (if necessary):**
    const typedDirectMessageChatPayload = directMessageChatPayload as (
      parent: unknown,
      args: Record<string, unknown>,
      context: { pubsub: { asyncIterator: (channel: string) => AsyncIterableIterator<string>; } }
    ) => AsyncIterableIterator<unknown>; // Adjust type based on actual return type

    const _args: Record<string, unknown> = {};
    const _parent: unknown = {};
    const context = {
      pubsub: {
        asyncIterator: (chatChannel: string): AsyncIterableIterator<string> => {
          return chatChannel;
        },
      },
    };

    const x = typedDirectMessageChatPayload?.subscribe(_parent, _args, context);
    expect(x).not.toBe(null);
  });
});
