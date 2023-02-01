import { directMessageChat } from "./directMessageChat";
import { describe, it, vi, expect } from "vitest";

describe("directMessageChat", () => {
  it("should return the correct filter function", () => {
    const pubsub = {
      asyncIterator: vi.fn(),
    };
    const context = {
      pubsub,
    };
    const _args = {};

    directMessageChat.subscribe(null, _args, context);

    const filterFunction = pubsub.asyncIterator.mock.calls[0][0];
    const filteredResult = filterFunction({
      directMessageChat: {
        text: "Hello!",
      },
    });

    expect(filteredResult).toEqual({
      text: "Hello!",
    });
  });
});
