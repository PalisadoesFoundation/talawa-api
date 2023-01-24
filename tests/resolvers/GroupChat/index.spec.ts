import { GroupChat } from "../../../src/resolvers/GroupChat/index";
import { GroupChatResolvers } from "../../../src/types/generatedGraphQLTypes";
import { creator } from "../../../src/resolvers/GroupChat/creator";
import { messages } from "../../../src/resolvers/GroupChat/messages";
import { organization } from "../../../src/resolvers/GroupChat/organization";
import { users } from "../../../src/resolvers/GroupChat/users";
import { beforeAll, describe, expect, it } from "vitest";

let testGroupChat: GroupChatResolvers;

beforeAll(() => {
  testGroupChat = {
    creator,
    messages,
    organization,
    users,
  };
});

describe("resolvers -> GroupChat -> index", () => {
  it("creates the GroupChat", () => {
    expect(testGroupChat).toStrictEqual(GroupChat);
  });
});
