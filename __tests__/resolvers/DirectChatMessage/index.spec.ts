import { DirectChatMessage } from "../../../src/lib/resolvers/DirectChatMessage/index";
import { DirectChatMessageResolvers } from "../../../src/generated/graphqlCodegen";
import { directChatMessageBelongsTo } from "../../../src/lib/resolvers/DirectChatMessage/directChatMessageBelongsTo";
import { receiver } from "../../../src/lib/resolvers/DirectChatMessage/receiver";
import { sender } from "../../../src/lib/resolvers/DirectChatMessage/sender";
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
