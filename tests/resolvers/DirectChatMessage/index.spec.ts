import { DirectChatMessage } from "../../../src/resolvers/DirectChatMessage/index";
import { DirectChatMessageResolvers } from "../../../src/types/generatedGraphQLTypes";
import { directChatMessageBelongsTo } from "../../../src/resolvers/DirectChatMessage/directChatMessageBelongsTo";
import { receiver } from "../../../src/resolvers/DirectChatMessage/receiver";
import { sender } from "../../../src/resolvers/DirectChatMessage/sender";
import { describe, it, beforeAll, expect } from "vitest";

let testDirectChatMessage: DirectChatMessageResolvers;

beforeAll(() => {
  testDirectChatMessage = {
    directChatMessageBelongsTo,
    receiver,
    sender,
  };
});

describe("resolvers -> DirectChatMessage -> index", () => {
  it("creates the DirectChatMessage", () => {
    expect(testDirectChatMessage).toStrictEqual(DirectChatMessage);
  });
});
