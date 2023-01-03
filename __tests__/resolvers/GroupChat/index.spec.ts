import { GroupChat } from "../../../src/lib/resolvers/GroupChat/index";
import { GroupChatResolvers } from "../../../src/generated/graphqlCodegen";
import { creator } from "../../../src/lib/resolvers/GroupChat/creator";
import { messages } from "../../../src/lib/resolvers/GroupChat/messages";
import { organization } from "../../../src/lib/resolvers/GroupChat/organization";
import { users } from "../../../src/lib/resolvers/GroupChat/users";
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
