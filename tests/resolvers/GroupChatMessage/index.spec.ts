import { GroupChatMessage } from "../../../src/resolvers/GroupChatMessage/index";
import { GroupChatMessageResolvers } from "../../../src/types/generatedGraphQLTypes";
import { groupChatMessageBelongsTo } from "../../../src/resolvers/GroupChatMessage/groupChatMessageBelongsTo";
import { sender } from "../../../src/resolvers/GroupChatMessage/sender";
import { describe, it, beforeAll, expect } from "vitest";

let testGroupChatMessage: GroupChatMessageResolvers;

beforeAll(() => {
  testGroupChatMessage = {
    groupChatMessageBelongsTo,
    sender,
  };
});

describe("resolvers -> GroupChatMesssage -> index", () => {
  it("creates the GroupChatMessage", () => {
    expect(testGroupChatMessage).toStrictEqual(GroupChatMessage);
  });
});
