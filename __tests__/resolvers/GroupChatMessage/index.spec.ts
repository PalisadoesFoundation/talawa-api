import { GroupChatMessage } from "../../../src/lib/resolvers/GroupChatMessage/index";
import { GroupChatMessageResolvers } from "../../../src/generated/graphqlCodegen";
import { groupChatMessageBelongsTo } from "../../../src/lib/resolvers/GroupChatMessage/groupChatMessageBelongsTo";
import { sender } from "../../../src/lib/resolvers/GroupChatMessage/sender";
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
